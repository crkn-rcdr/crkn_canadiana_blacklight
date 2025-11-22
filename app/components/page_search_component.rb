require 'cgi'

class PageSearchComponent < ViewComponent::Base
  def initialize(docId:, arkUrl:, term:)
    @document_id = docId
    @ark_url = arkUrl.to_s
    @term = (term || '').to_s
  end

  def render?
    @term.present? && @term != '*:*' && searchable_ark?
  end

  def go_to_page_aria_template
    t('blacklight.page_search.go_to_page_aria', page: '__PAGE__')
  end

  def ark_path
    return '' if @ark_url.blank?
    decoded = CGI.unescape(@ark_url)
    decoded.sub(%r{^https?://n2t.net/ark:/}i, '').sub(%r{^ark:/}i, '')
  end

  private

  def searchable_ark?
    path = ark_path
    return false if path.blank?
    # Skip collection-of-manifests ARKs (69429/s...)
    return false if path.start_with?('69429/s')
    true
  end
end
