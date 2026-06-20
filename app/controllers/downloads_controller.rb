require 'cgi'
require 'net/http'
require 'openssl'
require 'uri'

class DownloadsController < ApplicationController
  MAX_TOKEN_TTL = 30 * 60

  def index
    document_id = params[:id].to_s
    ark = params[:ark].to_s

    canvas_pdf_download_uris = []
    canvas_img_download_uris = []

    doc_pdf_uri = signed_item_pdf_uri(document_id, ark)

    manifest_items(ark).each_with_index do |canvas, index|
      canvas_noid, image_uri = canvas_download_parts(canvas)
      next unless canvas_noid

      canvas_pdf_download_uris << signed_access_pdf_uri(
        "#{canvas_noid}.pdf",
        "#{document_id}.#{index + 1}.pdf"
      )
      canvas_img_download_uris << image_uri
    end

    render json: {
      "canvasDownloadPdfUris" => canvas_pdf_download_uris,
      "docPdfUri" => doc_pdf_uri,
      "canvasDownloadImgUris" => canvas_img_download_uris
    }
  end

  private

  def manifest_items(ark)
    return [] if ark.blank?

    uri = URI("#{Rails.configuration.x.iiif_manifest_base}/#{ark}")
    result = JSON.parse(Net::HTTP.get(uri)) rescue {}
    result['items'] || []
  rescue => e
    Rails.logger.warn("DownloadsController manifest error: #{e.class}: #{e.message}") if defined?(Rails)
    []
  end

  def canvas_download_parts(canvas)
    image_uri = canvas.dig('thumbnail', 0, 'id') || canvas.dig('items', 0, 'items', 0, 'body', 'id')
    return [nil, nil] if image_uri.blank?

    match = image_uri.match(%r{/iiif/2/([^/]+)/full})
    return [nil, image_uri] unless match

    [CGI.unescape(match[1]), image_uri]
  end

  def signed_item_pdf_uri(slug, noid)
    return '' if slug.blank? || noid.blank? || download_token_secret.blank?

    expires = token_expires
    query = {
      slug: slug,
      noid: noid,
      type: 'PDF',
      expires: expires,
      sig: item_signature(slug, noid, 'PDF', [], expires)
    }

    "#{download_endpoint}?#{URI.encode_www_form(query)}"
  end

  def signed_access_pdf_uri(object_path, filename)
    return '' if object_path.blank? || download_token_secret.blank?

    expires = token_expires
    query = {
      expires: expires,
      filename: filename,
      sig: object_signature('access', object_path, filename, expires)
    }

    "#{download_endpoint}/access/#{escape_object_path(object_path)}?#{URI.encode_www_form(query)}"
  end

  def item_signature(slug, noid, file_type, canvas_noids, expires)
    payload = ['v2', slug, noid, file_type.upcase, canvas_noids.join("\n"), expires].join("\n")
    hmac(payload)
  end

  def object_signature(repository, object_path, filename, expires)
    payload = ['v1', repository, object_path, filename, expires].join("\n")
    hmac(payload)
  end

  def hmac(payload)
    return '' if download_token_secret.blank?

    OpenSSL::HMAC.hexdigest('SHA256', download_token_secret, payload)
  end

  def token_expires
    Time.now.to_i + token_ttl
  end

  def token_ttl
    raw_ttl = Rails.configuration.x.download_token_ttl
    raw_ttl = ENV.fetch('DOWNLOAD_TOKEN_TTL', '1800') unless raw_ttl.is_a?(Numeric) || raw_ttl.is_a?(String)
    ttl = raw_ttl.to_i
    ttl = MAX_TOKEN_TTL if ttl <= 0 || ttl > MAX_TOKEN_TTL
    ttl
  end

  def download_token_secret
    secret = Rails.configuration.x.download_token_secret
    secret = ENV.fetch('DOWNLOAD_TOKEN_SECRET', '') unless secret.is_a?(String)
    secret.to_s
  end

  def download_endpoint
    endpoint = Rails.configuration.x.download_api_endpoint
    endpoint = ENV.fetch('DOWNLOAD_API_ENDPOINT', 'https://beta-download.canadiana.ca/download') unless endpoint.is_a?(String)
    endpoint = 'https://beta-download.canadiana.ca/download' if endpoint.blank?
    endpoint = endpoint.sub(%r{/\z}, '')
    endpoint.end_with?('/download') ? endpoint : "#{endpoint}/download"
  end

  def escape_object_path(object_path)
    object_path.split('/').map { |segment| URI.encode_www_form_component(segment).gsub('+', '%20') }.join('/')
  end
end
