class DownloadsController < ApplicationController
    HEAD_TIMEOUT = 5

    def index
        @documentId            = params[:id]
        @ark                   = params[:ark]
        key                    =  Rails.configuration.x.cap_pass
        expires                = (Time.now.to_i + 86400).to_s
        swift_uri              = "https://swift.canadiana.ca"


        doc_pdf_uri                = ""
        doc_pdf_exists             = false
        canvas_pdf_download_uris   = []
        canvas_pdf_exists          = []
        canvas_img_download_uris   = []

        # Build signed URL for full searchable PDF (for direct download)
        if @ark.present? && key.present?
          expires_i             = Time.now.to_i + 86400  # expires in a day
          path                  = File.join("/v1/AUTH_crkn/access-files", "/#{@ark}.pdf")
          payload               = "GET\n#{expires_i}\n#{path}"
          digest                = OpenSSL::Digest.new('sha1')
          signature             = OpenSSL::HMAC.hexdigest(digest, key, payload)
          uri_suffix            = "&temp_url_expires=#{expires_i}&temp_url_sig=#{signature}"
          doc_pdf_uri           = "#{swift_uri}#{path}?filename=#{@documentId}.pdf#{uri_suffix}"
          doc_pdf_exists        = swift_head_ok?("access-files/#{@ark}.pdf") == true
        end

        # Fetch manifest to derive per-canvas PDF download URLs
        begin
          uri = URI(Rails.configuration.x.iiif_manifest_base+"/"+@ark)
          res = Net::HTTP.get(uri)
          result = JSON.parse(res) rescue {}
          items = result['items'] || []
          canvasNumber = 0
          items.each do |canvas|
            canvasNumber += 1
            thumb = canvas.dig('thumbnail', 0, 'id')
            next unless thumb
            match = thumb.match(%r{2/(.*?)/full})
            next unless match
            extracted_string = match[1]
            canvasId              = extracted_string.gsub('%2F', '/').gsub('%2f', '/')
            expires_i             = Time.now.to_i + 86400
            path                  = File.join("/v1/AUTH_crkn/access-files", "/#{canvasId}.pdf")
            payload               = "GET\n#{expires_i}\n#{path}"
            digest                = OpenSSL::Digest.new('sha1')
            signature             = OpenSSL::HMAC.hexdigest(digest, key, payload)
            uri_suffix            = "&temp_url_expires=#{expires_i}&temp_url_sig=#{signature}"
            canvas_pdf_uri        = "#{swift_uri}#{path}?filename=#{@documentId}.#{canvasNumber}.pdf#{uri_suffix}"
            canvas_img_uri        = "https://image-tor.canadiana.ca/iiif/2/#{extracted_string}/full/max/0/default.jpg"
            canvas_pdf_download_uris << canvas_pdf_uri
            exists_val = swift_head_ok?("access-files/#{canvasId}.pdf")
            canvas_pdf_exists << (exists_val == true)
            canvas_img_download_uris << canvas_img_uri
          end
        rescue => e
          Rails.logger.warn("DownloadsController manifest error: #{e.class}: #{e.message}") if defined?(Rails)
        end
        render :json => {
          "canvasDownloadPdfUris"  => canvas_pdf_download_uris,
          "canvasPdfExists"        => canvas_pdf_exists,
          "docPdfUri"              => doc_pdf_uri,
          "docPdfExists"           => doc_pdf_exists,
          "canvasDownloadImgUris"  => canvas_img_download_uris
        }
    end

    private

    def swift_head_ok?(object_path)
      token, storage_url, fallback_storage = swift_auth
      return false unless token && (storage_url || fallback_storage)

      # Prefer the configured preauth URL first, then any storage returned by auth
      storage_urls = [storage_url, fallback_storage].compact.uniq
      storage_urls.each do |base|
        url = File.join(base, object_path)
        uri = URI.parse(url)
        begin
          Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: HEAD_TIMEOUT, read_timeout: HEAD_TIMEOUT) do |http|
            # Use a small ranged GET to avoid CORS/HEAD blocking; only fetch first byte
            req = Net::HTTP::Get.new(uri.request_uri)
            req['X-Auth-Token'] = token
            req['Range'] = 'bytes=0-0'
            res = http.request(req)
            return true if res.is_a?(Net::HTTPSuccess) || res.is_a?(Net::HTTPPartialContent)
          end
        rescue Net::OpenTimeout, Net::ReadTimeout
          Rails.logger.info("Swift HEAD timeout for #{url}") if defined?(Rails)
          next
        rescue => e
          Rails.logger.info("Swift HEAD failed for #{url}: #{e.class}: #{e.message}") if defined?(Rails)
          next
        end
      end
      nil
    end

    def swift_auth
      return @swift_auth if defined?(@swift_auth)

      auth_url    = ENV['SWIFT_AUTH_URL']
      username    = ENV['SWIFT_USERNAME']
      password    = ENV['SWIFT_PASSWORD']
      preauth_url = ENV['SWIFT_PREAUTH_URL']

      uri = URI.parse(auth_url)
      token = storage_from_auth = nil

      Rails.logger.info("Swift auth to #{auth_url} as #{username}")
      Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: HEAD_TIMEOUT, read_timeout: HEAD_TIMEOUT) do |http|
        req = Net::HTTP::Get.new(uri.request_uri)
        req['X-Auth-User'] = username
        req['X-Auth-Key'] = password
        res = http.request(req)
        if res.is_a?(Net::HTTPSuccess)
          token            = res['X-Auth-Token']
          storage_from_auth = res['X-Storage-Url']
          Rails.logger.info("Swift auth success, storage URL: #{storage_from_auth || '(none from auth)'}")
        else
          Rails.logger.warn("Swift auth failed: #{res.code} #{res.message}")
        end
      end

      # Prefer preauth URL (AUTH_crkn) first; use auth storage as fallback.
      @swift_auth = [token, preauth_url, storage_from_auth]
    rescue => e
      Rails.logger.warn("Swift auth failed: #{e.class}: #{e.message}") if defined?(Rails)
      @swift_auth = [nil, nil, nil]
    end
end
