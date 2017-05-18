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
    @county_centroids = Hash.new

    @crashes = Crash.where("year = ? AND fips = ?", @year.to_i, @fips.to_i)

    open("https://raw.githubusercontent.com/aaronxsu/MyData/master/PA_Road_Crash_Count_by_County_2004_2013_GeoJSON/" + @fips.to_s + ".geojson") do |f|
      @roads = JSON.parse(f.read)
    end

    open("https://raw.githubusercontent.com/aaronxsu/MyData/master/pa_county_centroid.json") do |f|
      @county_centroids = JSON.parse(f.read).select { |county| county["FIPS"] == @fips.to_i }.first
    end

    @keys = ["id", "name", "label"]
    @id_values = ["month", "day", "hour", "fatals", "drunk", "weather"]
    @id_labels = ["Month of a Year", "Day of a Week", "Time of a Day", "Number of Fatalities", "Drunk Individuals", "Weather Conditions"]

    @attr_filter_html = Array.new
    @id_values.each_with_index do |val, index|
      @attr_filter_html.push([[@keys[0], val], [@keys[1], val.capitalize + "..."], [@keys[2], @id_labels[index]]].to_h)
    end


    js :crashes => @crashes, :roads => @roads, :year => @year, :fips => @fips, :county_name => @county_centroids['County'], :county_centroid => [@county_centroids["center_lat"], @county_centroids["center_lng"]]

  end

end
