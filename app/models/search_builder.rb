# frozen_string_literal: true
class SearchBuilder < Blacklight::SearchBuilder
  include Blacklight::Solr::SearchBuilderBehavior
  include BlacklightRangeLimit::RangeLimitBuilder


  self.default_processor_chain += [:tag_and_exclude_facets]

  def tag_and_exclude_facets(solr_parameters)
    return unless solr_parameters

    # Map each facet field key and Solr field to a unique tag name
    facet_configs = blacklight_config.facet_fields
    tag_map = {}
    facet_configs.each do |key, config|
      solr_field = config.field || key
      tag = "tag_#{key.to_s.parameterize.underscore}"
      tag_map[key.to_s] = tag
      tag_map[solr_field.to_s] = tag
    end

    # 1. Tag facet filter queries in solr_parameters[:fq]
    if solr_parameters[:fq].is_a?(Array)
      solr_parameters[:fq] = solr_parameters[:fq].map do |fq_entry|
        next fq_entry unless fq_entry.is_a?(String)

        # Match which facet field this filter belongs to
        matched_tag = nil
        tag_map.each do |field_name, tag|
          if fq_entry =~ /(?:f=#{Regexp.escape(field_name)}\b|\b#{Regexp.escape(field_name)}\s*:)/
            matched_tag = tag
            break
          end
        end

        if matched_tag && !fq_entry.include?("tag=#{matched_tag}")
          if fq_entry.start_with?('{!')
            fq_entry.sub(/\A\{!/, "{!tag=#{matched_tag} ")
          else
            "{!tag=#{matched_tag}}#{fq_entry}"
          end
        else
          fq_entry
        end
      end
    end

    # 2. Exclude corresponding tags in facet.field / facet_field
    [:'facet.field', :facet_field].each do |param_key|
      fields = solr_parameters[param_key]
      next unless fields.is_a?(Array)

      solr_parameters[param_key] = fields.map do |field_entry|
        next field_entry unless field_entry.is_a?(String)

        clean_field = field_entry.sub(/\A\{![^}]*\}\s*/, '')
        tag = tag_map[clean_field]

        if tag && !field_entry.include?("ex=#{tag}")
          "{!ex=#{tag} key=#{clean_field}}#{clean_field}"
        else
          field_entry
        end
      end
    end
  end
end
