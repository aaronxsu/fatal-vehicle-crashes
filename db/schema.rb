# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170313005227) do

  create_table "crashes", force: :cascade do |t|
    t.integer  "year"
    t.integer  "month"
    t.string   "month_text"
    t.integer  "day"
    t.integer  "day_week"
    t.string   "day_week_text"
    t.integer  "hour"
    t.integer  "time_order"
    t.integer  "crash_factor"
    t.integer  "weather"
    t.integer  "fatals"
    t.integer  "drunk"
    t.float    "latitude"
    t.float    "longitude"
    t.string   "county"
    t.string   "state"
    t.integer  "state_fips"
    t.integer  "county_fips"
    t.integer  "fips"
    t.datetime "created_at",    null: false
    t.datetime "updated_at",    null: false
  end

end
