#!/usr/bin/env ruby
# frozen_string_literal: true

# Backfill the Rights Statement facet from stored MARC 540 fields.
#
# For each Solr document with rights_stat_tsim, this script reads marc_ss,
# finds 540 fields with a rightsstatements.org URL in $u, and writes the
# canonical rightsstatements.org label to rights_statement_ssim_str.

$stdout.sync = true
$stderr.sync = true

require 'json'
require 'optparse'
require 'rexml/document'
require 'rsolr'
require_relative '../lib/rights_statement_labeler'

def load_env_defaults!
  root_dir = File.expand_path('..', __dir__)
  ['.env.dev', '.env'].each do |filename|
    path = File.join(root_dir, filename)
    next unless File.file?(path)

    File.foreach(path) do |line|
      line = line.strip
      next if line.empty? || line.start_with?('#')

      key, val = line.split('=', 2)
      next if key.nil? || val.nil?

      key = key.strip
      val = val.strip
      val = val[1..-2] if (val.start_with?('"') && val.end_with?('"')) || (val.start_with?("'") && val.end_with?("'"))
      ENV[key] ||= val unless key.empty?
    end
  end
end

load_env_defaults!

options = {
  solr_url: ENV.fetch('SOLR_URL', nil),
  query: 'rights_stat_tsim:*',
  rows: 1000,
  max_docs: 0,
  source_field: 'marc_ss',
  target_field: 'rights_statement_ssim_str',
  commit: true,
  dry_run: false
}

OptionParser.new do |parser|
  parser.banner = 'Usage: bundle exec ruby script/backfill_rights_statement_facet.rb [options]'

  parser.on('--solr-url URL', 'Solr core URL. Defaults to SOLR_URL.') do |value|
    options[:solr_url] = value
  end

  parser.on('--query QUERY', 'Solr query to scan. Defaults to rights_stat_tsim:*.') do |value|
    options[:query] = value
  end

  parser.on('--rows N', Integer, 'Rows per Solr cursor page. Defaults to 1000.') do |value|
    options[:rows] = value
  end

  parser.on('--max-docs N', Integer, 'Stop after N docs. Defaults to 0, meaning all docs.') do |value|
    options[:max_docs] = value
  end

  parser.on('--source-field FIELD', 'Stored MARC XML field. Defaults to marc_ss.') do |value|
    options[:source_field] = value
  end

  parser.on('--target-field FIELD', 'Facet field to populate. Defaults to rights_statement_ssim_str.') do |value|
    options[:target_field] = value
  end

  parser.on('--no-commit', 'Do not commit after updating.') do
    options[:commit] = false
  end

  parser.on('--dry-run', 'Parse and report without writing to Solr.') do
    options[:dry_run] = true
  end
end.parse!

abort 'SOLR_URL is required. Pass --solr-url or set SOLR_URL.' if options[:solr_url].to_s.empty?
abort '--rows must be greater than 0.' unless options[:rows].positive?
abort '--max-docs must be 0 or greater.' if options[:max_docs].negative?

def marc_xml_from(document, source_field)
  value = document[source_field]
  value = value.first if value.is_a?(Array)
  value.to_s
end

def rights_statement_values(marc_xml)
  return [] if marc_xml.empty?

  document = REXML::Document.new(marc_xml)

  values = []
  REXML::XPath.each(document, '//datafield[@tag="540"]') do |field|
    field.elements.each('subfield') do |subfield|
      next unless subfield.attributes['code'] == 'u'

      value = RightsStatementLabeler.label_for_url(subfield.text)
      values << value if value
    end
  end

  values.uniq
rescue REXML::ParseException => e
  warn "[WARN] Could not parse MARC XML: #{e.message.lines.first&.strip}"
  []
end

def update_documents(solr, updates)
  solr.update(
    data: JSON.generate(updates),
    headers: { 'Content-Type' => 'application/json' }
  )
end

solr = RSolr.connect(url: options[:solr_url])
cursor_mark = '*'

seen = 0
updated = 0
with_values = 0
without_values = 0
parse_errors = 0
started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)

puts "[INFO] Starting rights statement facet backfill"
puts "[INFO] solr=#{options[:solr_url]} query=#{options[:query].inspect} rows=#{options[:rows]} target=#{options[:target_field]} dry_run=#{options[:dry_run]}"

loop do
  limit = options[:max_docs].zero? ? options[:rows] : [options[:rows], options[:max_docs] - seen].min
  break if limit <= 0

  response = solr.get(
    'select',
    params: {
      q: options[:query],
      rows: limit,
      fl: "id,#{options[:source_field]}",
      sort: 'id asc',
      cursorMark: cursor_mark
    }
  )

  docs = response.dig('response', 'docs') || []
  break if docs.empty?

  updates = docs.map do |doc|
    values = rights_statement_values(marc_xml_from(doc, options[:source_field]))
    with_values += 1 if values.any?
    without_values += 1 if values.empty?

    {
      'id' => doc.fetch('id'),
      options[:target_field] => { 'set' => values.empty? ? nil : values }
    }
  rescue StandardError => e
    parse_errors += 1
    warn "[WARN] Could not derive rights statement for #{doc['id']}: #{e.class}: #{e.message}"
    nil
  end.compact

  update_documents(solr, updates) unless options[:dry_run] || updates.empty?

  seen += docs.length
  updated += updates.length

  elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at
  puts "[INFO] progress seen=#{seen} updated=#{updated} with_values=#{with_values} without_values=#{without_values} errors=#{parse_errors} elapsed_s=#{elapsed.round(1)}"

  next_cursor_mark = response['nextCursorMark']
  break if next_cursor_mark.nil? || next_cursor_mark == cursor_mark

  cursor_mark = next_cursor_mark
end

unless options[:dry_run] || !options[:commit]
  puts '[INFO] Committing Solr updates'
  solr.commit
end

summary = {
  schema: 'rights-statement-facet-backfill-v2',
  solr_url: options[:solr_url],
  query: options[:query],
  target_field: options[:target_field],
  dry_run: options[:dry_run],
  seen: seen,
  updated: updated,
  with_values: with_values,
  without_values: without_values,
  errors: parse_errors,
  elapsed_seconds: (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at).round(3)
}

puts "[DONE] #{JSON.generate(summary)}"
