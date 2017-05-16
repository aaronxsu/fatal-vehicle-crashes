require 'open-uri'
require 'uri'
require 'net/http'
require 'json'

class CrashesController < ApplicationController

  def index

    open('https://raw.githubusercontent.com/aaronxsu/MyData/master/PA_counties_w_crash_count_by_year.geojson') do |f|
      @county = JSON.parse(f.read)
    end

    js :county => @county

  end

  def search

    @year = params[:year]
    @fips = params[:fips]

  end

end
