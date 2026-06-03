# Centralize configurable external endpoints and read from ENV.
Rails.configuration.x.iiif_manifest_base = ENV.fetch('IIIF_MANIFEST_BASE', 'https://www-iiif-pres.canadiana.ca/manifest')
Rails.configuration.x.iiif_content_search_base = ENV.fetch('IIIF_CONTENT_SEARCH_BASE', 'https://crkn-iiif-content-search.azurewebsites.net/search')
Rails.configuration.x.cap_pass = ENV.fetch('CAP_PASS', '')

