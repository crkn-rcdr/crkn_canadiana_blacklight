# frozen_string_literal: true

require 'net/http'
require 'json'
require 'uri'
require 'time'

# script/backfill_resource_types.rb
# Backfills resource_type_ssim_str and cleans up serial_title for all documents
# in Solr (http://10.202.1.33:8983/solr/blacklight_marc).

SOLR_URL = ENV.fetch('SOLR_URL', 'http://10.202.1.33:8983/solr/blacklight_marc')
BATCH_SIZE = ENV.fetch('BATCH_SIZE', '2000').to_i
COMMIT_EVERY = ENV.fetch('COMMIT_EVERY', '20000').to_i

def get_json(url_str)
  uri = URI.parse(url_str)
  res = Net::HTTP.get_response(uri)
  raise "HTTP #{res.code}: #{res.message}" unless res.is_a?(Net::HTTPSuccess)

  JSON.parse(res.body)
end

def post_json(url_str, data)
  uri = URI.parse(url_str)
  http = Net::HTTP.new(uri.host, uri.port)
  req = Net::HTTP::Post.new(uri.request_uri, { 'Content-Type' => 'application/json' })
  req.body = JSON.generate(data)
  res = http.request(req)
  raise "HTTP #{res.code}: #{res.body}" unless res.is_a?(Net::HTTPSuccess)

  res
end

def determine_resource_type(doc)
  is_serial = doc['is_serial'].is_a?(Array) && doc['is_serial'].first == 'Yes'
  is_issue = doc['is_issue'].is_a?(Array) && doc['is_issue'].first == 'Yes'

  return 'Periodical Titles' if is_serial
  return 'Periodical Issues' if is_issue

  collections = doc['collectionen_path'].is_a?(Array) ? doc['collectionen_path'].join(' ') : ''
  return 'Maps' if collections =~ /map/i
  return 'Government Documents' if collections =~ /government/i
  return 'Books & Monographs' if collections =~ /monograph/i

  'Books & Monographs'
end

def should_have_serial_title(doc)
  is_serial = doc['is_serial'].is_a?(Array) && doc['is_serial'].first == 'Yes'
  is_issue = doc['is_issue'].is_a?(Array) && doc['is_issue'].first == 'Yes'
  has_key = doc['serial_key'].is_a?(Array) && !doc['serial_key'].empty?
  is_serial || is_issue || has_key
end
