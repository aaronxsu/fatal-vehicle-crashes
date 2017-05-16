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

    @crashes = Crash.where("year = ? AND fips = ?", @year.to_i, @fips.to_i)

    open("https://raw.githubusercontent.com/aaronxsu/MyData/master/PA_Road_Crash_Count_by_County_2004_2013_GeoJSON/" + @fips.to_s + ".geojson") do |f|
     @roads = JSON.parse(f.read)
    end

    js :crashes => @crashes, :roads => @roads, :year => @year, :fips => @fips

  end

end
