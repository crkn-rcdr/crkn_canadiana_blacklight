#!/usr/bin/env ruby
# frozen_string_literal: true

# Backfill the Publication Date fields (pub_date_si and pub_date_ssim) from stored MARC XML (marc_ss).
#
# For each Solr document with marc_ss, this script reads the MARC XML,
# extracts the original publication year (prioritizing RDA 264$c [ind2=1], AACR2 260$c,
# 008 Date 2 for reprints/reproductions, 534$c/p notes, and 500$a notes over digitization dates),
# and updates pub_date_si and pub_date_ssim in Solr.

$stdout.sync = true
$stderr.sync = true

require 'json'
require 'optparse'
require 'rexml/document'
require 'rsolr'

options = {
  solr_url: ENV.fetch('SOLR_URL', nil),
  query: 'marc_ss:*',
  rows: 1000,
  max_docs: 0,
  source_field: 'marc_ss',
  commit: true,
  dry_run: false,
  only_changed: true
}

OptionParser.new do |parser|
  parser.banner = 'Usage: bundle exec ruby script/backfill_publication_date.rb [options]'

  parser.on('--solr-url URL', 'Solr core URL. Defaults to SOLR_URL.') do |value|
    options[:solr_url] = value
  end

  parser.on('--query QUERY', 'Solr query to scan. Defaults to marc_ss:*.') do |value|
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

  parser.on('--all-docs', 'Update all docs regardless of whether existing date values differ.') do
    options[:only_changed] = false
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

def extract_year_from_string(str)
  return nil if str.nil? || str.strip.empty?

  cleaned = str.to_s.gsub(/[\(\)\[\]\.\,\;\"\'\?]/, ' ')

  current_year = Time.now.year + 2
  if (match = cleaned.match(/\b(1\d{3}|20\d{2})\b/))
    year = match[1].to_i
    return year if year >= 1000 && year <= current_year
  end

  if (match = cleaned.match(/\b(1\d{2}|20\d)[u\-\?]\b/i))
    return "#{match[1]}0".to_i
  end

  if (match = cleaned.match(/\b(1\d|20)[u\-\?]{2}\b/i))
    return "#{match[1]}00".to_i
  end

  nil
end

def extract_original_publication_year(marc_xml)
  return nil if marc_xml.nil? || marc_xml.strip.empty?

  doc = REXML::Document.new(marc_xml)

  # 1. Check 264$c with ind2 == '1' (Publication)
  REXML::XPath.each(doc, '//datafield[@tag="264"][@ind2="1"]') do |df|
    df.elements.each('subfield') do |sf|
      next unless sf.attributes['code'] == 'c'
      year = extract_year_from_string(sf.text)
      return year if year
    end
  end

  # 2. Check 260$c
  REXML::XPath.each(doc, '//datafield[@tag="260"]') do |df|
    df.elements.each('subfield') do |sf|
      next unless sf.attributes['code'] == 'c'
      year = extract_year_from_string(sf.text)
      return year if year
    end
  end

  # 3. Check any other 264$c (e.g. manufacture or production)
  REXML::XPath.each(doc, '//datafield[@tag="264"]') do |df|
    df.elements.each('subfield') do |sf|
      next unless sf.attributes['code'] == 'c'
      year = extract_year_from_string(sf.text)
      return year if year
    end
  end

  # 4. Check 008 control field (Date 2 for reprint/reproduction 'r')
  cf008_node = REXML::XPath.first(doc, '//controlfield[@tag="008"]')
  cf008 = cf008_node&.text
  if cf008 && cf008.length >= 15
    type_of_date = cf008[6]
    date1 = cf008[7..10]
    date2 = cf008[11..14]

    if type_of_date == 'r'
      year2 = extract_year_from_string(date2)
      return year2 if year2
    end

    year1 = extract_year_from_string(date1)
    return year1 if year1 && type_of_date != 'r'
  end

  # 5. Check 534$c / 534$p (Original Version Note)
  REXML::XPath.each(doc, '//datafield[@tag="534"]') do |df|
    df.elements.each('subfield') do |sf|
      next unless %w[c p].include?(sf.attributes['code'])
      year = extract_year_from_string(sf.text)
      return year if year
    end
  end

  # 6. Check 500$a general notes
  REXML::XPath.each(doc, '//datafield[@tag="500"]') do |df|
    df.elements.each('subfield') do |sf|
      next unless sf.attributes['code'] == 'a'
      year = extract_year_from_string(sf.text)
      return year if year
    end
  end

  # 7. Fallback to 008 Date 1
  if cf008 && cf008.length >= 11
    year1 = extract_year_from_string(cf008[7..10])
    return year1 if year1
  end

  nil
rescue REXML::ParseException => e
  warn "[WARN] Could not parse MARC XML: #{e.message.lines.first&.strip}"
  nil
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
unchanged = 0
with_values = 0
without_values = 0
parse_errors = 0
started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)

puts "[INFO] Starting publication date backfill"
puts "[INFO] solr=#{options[:solr_url]} query=#{options[:query].inspect} rows=#{options[:rows]} only_changed=#{options[:only_changed]} dry_run=#{options[:dry_run]}"

loop do
  limit = options[:max_docs].zero? ? options[:rows] : [options[:rows], options[:max_docs] - seen].min
  break if limit <= 0

  response = solr.get(
    'select',
    params: {
      q: options[:query],
      rows: limit,
      fl: "id,#{options[:source_field]},pub_date_si,pub_date_ssim",
      sort: 'id asc',
      cursorMark: cursor_mark
    }
  )

  docs = response.dig('response', 'docs') || []
  break if docs.empty?

  batch_updates = []

  docs.each do |doc|
    doc_id = doc.fetch('id')
    year = extract_original_publication_year(marc_xml_from(doc, options[:source_field]))

    if year
      with_values += 1
    else
      without_values += 1
    end

    # Check if doc is already up-to-date
    existing_si = doc['pub_date_si']
    existing_si = existing_si.first if existing_si.is_a?(Array)
    existing_ssim = Array(doc['pub_date_ssim']).map(&:to_i)

    already_matches = (existing_si.to_i == year.to_i) && (existing_ssim == (year ? [year] : []))

    if options[:only_changed] && already_matches
      unchanged += 1
      next
    end

    batch_updates << {
      'id' => doc_id,
      'pub_date_si' => { 'set' => year },
      'pub_date_ssim' => { 'set' => year ? [year] : nil }
    }
  rescue StandardError => e
    parse_errors += 1
    warn "[WARN] Could not derive publication date for #{doc['id']}: #{e.class}: #{e.message}"
  end

  update_documents(solr, batch_updates) unless options[:dry_run] || batch_updates.empty?

  seen += docs.length
  updated += batch_updates.length

  elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at
  puts "[INFO] progress seen=#{seen} updated=#{updated} unchanged=#{unchanged} with_values=#{with_values} without_values=#{without_values} errors=#{parse_errors} elapsed_s=#{elapsed.round(1)}"

  next_cursor_mark = response['nextCursorMark']
  break if next_cursor_mark.nil? || next_cursor_mark == cursor_mark

  cursor_mark = next_cursor_mark
end

unless options[:dry_run] || !options[:commit]
  puts '[INFO] Committing Solr updates'
  solr.commit
end

summary = {
  schema: 'publication-date-backfill-v1',
  solr_url: options[:solr_url],
  query: options[:query],
  dry_run: options[:dry_run],
  seen: seen,
  updated: updated,
  unchanged: unchanged,
  with_values: with_values,
  without_values: without_values,
  errors: parse_errors,
  elapsed_seconds: (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at).round(3)
}

puts "[DONE] #{JSON.generate(summary)}"
