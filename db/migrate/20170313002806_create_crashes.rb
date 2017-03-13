class CreateCrashes < ActiveRecord::Migration[5.0]
  def change
    create_table :crashes do |t|
      t.integer :case_id
      t.integer :year
      t.integer :month
      t.string :month_text
      t.integer :day
      t.integer :day_week
      t.string :day_week_text
      t.integer :hour
      t.integer :time_order
      t.integer :crash_factor
      t.integer :weather
      t.integer :fatals
      t.integer :drunk
      t.float :latitude
      t.float :longitude
      t.string :county
      t.string :state
      t.integer :state_fips
      t.integer :county_fips
      t.integer :fips

      t.timestamps
    end
  end
end
