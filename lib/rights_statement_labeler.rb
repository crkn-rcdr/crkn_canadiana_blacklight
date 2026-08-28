# frozen_string_literal: true

module RightsStatementLabeler
  URI_PATTERN = %r{https?://rightsstatements\.org/(?:vocab|page)/([^/?#]+)/1\.0(?:[/?#]|$)}i.freeze

  STATEMENTS_BY_CODE = {
    'cne' => {
      label: 'Copyright Not Evaluated',
      uri_code: 'CNE',
      category: 'other',
      canonical_url: 'https://rightsstatements.org/vocab/CNE/1.0/'
    },
    'inc' => {
      label: 'In Copyright',
      uri_code: 'InC',
      category: 'in_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/InC/1.0/'
    },
    'inc-edu' => {
      label: 'In Copyright - Educational Use Permitted',
      uri_code: 'InC-EDU',
      category: 'in_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/InC-EDU/1.0/'
    },
    'inc-nc' => {
      label: 'In Copyright - Non-Commercial Use Permitted',
      uri_code: 'InC-NC',
      category: 'in_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/InC-NC/1.0/'
    },
    'inc-ow-eu' => {
      label: 'In Copyright - EU Orphan Work',
      uri_code: 'InC-OW-EU',
      category: 'in_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/InC-OW-EU/1.0/'
    },
    'inc-ruu' => {
      label: 'In Copyright - Rights-holder(s) Unlocatable or Unidentifiable',
      uri_code: 'InC-RUU',
      category: 'in_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/InC-RUU/1.0/'
    },
    'nkc' => {
      label: 'No Known Copyright',
      uri_code: 'NKC',
      category: 'other',
      canonical_url: 'https://rightsstatements.org/vocab/NKC/1.0/'
    },
    'noc-cr' => {
      label: 'No Copyright - Contractual Restrictions',
      uri_code: 'NoC-CR',
      category: 'no_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/NoC-CR/1.0/'
    },
    'noc-nc' => {
      label: 'No Copyright - Non-Commercial Use Only',
      uri_code: 'NoC-NC',
      category: 'no_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/NoC-NC/1.0/'
    },
    'noc-oklr' => {
      label: 'No Copyright - Other Known Legal Restrictions',
      uri_code: 'NoC-OKLR',
      category: 'no_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/NoC-OKLR/1.0/'
    },
    'noc-us' => {
      label: 'No Copyright - United States',
      uri_code: 'NoC-US',
      category: 'no_copyright',
      canonical_url: 'https://rightsstatements.org/vocab/NoC-US/1.0/'
    },
    'und' => {
      label: 'Copyright Undetermined',
      uri_code: 'UND',
      category: 'other',
      canonical_url: 'https://rightsstatements.org/vocab/UND/1.0/'
    },
    'ogl-canada' => {
      label: 'Open Government Licence - Canada',
      uri_code: 'OGL-Canada',
      category: 'no_copyright',
      canonical_url: 'https://open.canada.ca/en/open-government-licence-canada'
    },
    'pdm' => {
      label: 'Public Domain Mark 1.0',
      uri_code: 'PDM',
      category: 'no_copyright',
      canonical_url: 'https://creativecommons.org/publicdomain/mark/1.0/'
    },
    'cc0' => {
      label: 'CC0 1.0 Universal',
      uri_code: 'CC0',
      category: 'no_copyright',
      canonical_url: 'https://creativecommons.org/publicdomain/zero/1.0/'
    }
  }.freeze

  LABELS_BY_CODE = STATEMENTS_BY_CODE.transform_values { |statement| statement[:label] }.freeze
  STATEMENTS_BY_LABEL = STATEMENTS_BY_CODE.each_value.with_object({}) do |statement, index|
    index[statement[:label]] = statement
  end.freeze

  module_function

  def label_for_url(url)
    statement_for_url(url)&.fetch(:label)
  end

  def code_from_url(url)
    match = url.to_s.match(URI_PATTERN)
    return match[1].downcase.tr('l', 'i') if match

    if url.to_s =~ /open\.canada\.ca|open-government-licen|ogl-canada/i
      return 'ogl-canada'
    end

    if url.to_s =~ %r{creativecommons\.org/publicdomain/mark}i
      return 'pdm'
    end

    if url.to_s =~ %r{creativecommons\.org/publicdomain/zero}i
      return 'cc0'
    end

    nil
  end

  def statement_for_url(url)
    code = code_from_url(url)
    STATEMENTS_BY_CODE[code] if code
  end

  def statement_for_label(label)
    STATEMENTS_BY_LABEL[label.to_s]
  end

  def labels_for_text(text)
    statements = statements_for_text(text)
    return statements.map { |statement| statement[:label] }.uniq unless statements.empty?

    # Robust text fallbacks
    t = text.to_s
    if t =~ /open\.canada\.ca|open-government-licence|open government/i
      ['Open Government Licence - Canada']
    elsif t =~ %r{creativecommons\.org/publicdomain/mark}i
      ['Public Domain Mark 1.0']
    elsif t =~ %r{creativecommons\.org/publicdomain/zero}i
      ['CC0 1.0 Universal']
    elsif t =~ /no known copyright/i
      ['No Known Copyright']
    elsif t =~ /in copyright|all rights reserved|tous droits/i
      ['In Copyright']
    elsif t.present?
      cleaned = t.gsub(%r{https?://\S+}, '').strip
      [cleaned.presence || t.strip]
    else
      []
    end
  end

  def statements_for_text(text)
    t = text.to_s
    found = []

    t.scan(URI_PATTERN).flatten.each do |code|
      normalized_code = code.downcase.tr('l', 'i')
      stmt = STATEMENTS_BY_CODE[normalized_code]
      found << stmt if stmt
    end

    if t =~ /open\.canada\.ca|open-government-licen|ogl-canada/i
      found << STATEMENTS_BY_CODE['ogl-canada']
    end

    if t =~ %r{creativecommons\.org/publicdomain/mark}i
      found << STATEMENTS_BY_CODE['pdm']
    end

    if t =~ %r{creativecommons\.org/publicdomain/zero}i
      found << STATEMENTS_BY_CODE['cc0']
    end

    found.compact.uniq
  end

  def canonical_url_for_label(label)
    statement = statement_for_label(label)
    statement&.fetch(:canonical_url, nil)
  end

  def category_for_label(label)
    statement_for_label(label)&.fetch(:category, 'other') || 'other'
  end
end
