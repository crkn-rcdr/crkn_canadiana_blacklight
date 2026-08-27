# frozen_string_literal: true

module RightsStatementLabeler
  URI_PATTERN = %r{https?://rightsstatements\.org/(?:vocab|page)/([^/?#]+)/1\.0(?:[/?#]|$)}i.freeze

  STATEMENTS_BY_CODE = {
    'cne' => {
      label: 'Copyright Not Evaluated',
      uri_code: 'CNE',
      category: 'other'
    },
    'inc' => {
      label: 'In Copyright',
      uri_code: 'InC',
      category: 'in_copyright'
    },
    'inc-edu' => {
      label: 'In Copyright - Educational Use Permitted',
      uri_code: 'InC-EDU',
      category: 'in_copyright'
    },
    'inc-nc' => {
      label: 'In Copyright - Non-Commercial Use Permitted',
      uri_code: 'InC-NC',
      category: 'in_copyright'
    },
    'inc-ow-eu' => {
      label: 'In Copyright - EU Orphan Work',
      uri_code: 'InC-OW-EU',
      category: 'in_copyright'
    },
    'inc-ruu' => {
      label: 'In Copyright - Rights-holder(s) Unlocatable or Unidentifiable',
      uri_code: 'InC-RUU',
      category: 'in_copyright'
    },
    'nkc' => {
      label: 'No Known Copyright',
      uri_code: 'NKC',
      category: 'other'
    },
    'noc-cr' => {
      label: 'No Copyright - Contractual Restrictions',
      uri_code: 'NoC-CR',
      category: 'no_copyright'
    },
    'noc-nc' => {
      label: 'No Copyright - Non-Commercial Use Only',
      uri_code: 'NoC-NC',
      category: 'no_copyright'
    },
    'noc-oklr' => {
      label: 'No Copyright - Other Known Legal Restrictions',
      uri_code: 'NoC-OKLR',
      category: 'no_copyright'
    },
    'noc-us' => {
      label: 'No Copyright - United States',
      uri_code: 'NoC-US',
      category: 'no_copyright'
    },
    'und' => {
      label: 'Copyright Undetermined',
      uri_code: 'UND',
      category: 'other'
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
    match[1].downcase if match
  end

  def statement_for_url(url)
    code = code_from_url(url)
    STATEMENTS_BY_CODE[code] if code
  end

  def statement_for_label(label)
    STATEMENTS_BY_LABEL[label.to_s]
  end

  def labels_for_text(text)
    statements_for_text(text).map { |statement| statement[:label] }.uniq
  end

  def statements_for_text(text)
    text.to_s.scan(URI_PATTERN).flatten.filter_map do |code|
      STATEMENTS_BY_CODE[code.downcase]
    end.uniq
  end

  def canonical_url_for_label(label)
    statement = statement_for_label(label)
    "https://rightsstatements.org/vocab/#{statement[:uri_code]}/1.0/" if statement
  end

  def category_for_label(label)
    statement_for_label(label)&.fetch(:category, 'other') || 'other'
  end
end
