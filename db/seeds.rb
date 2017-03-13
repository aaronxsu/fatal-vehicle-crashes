require 'csv'

csv_text = File.read(Rails.root.join("lib", "seeds", "all_accidents_state_county.csv"))
csv = CSV.parse(csv_text, :headers => true, :encoding => 'ISO-8859-1')
csv.each do |row|
  t = Crash.new
  t.year = row['year']
  t.month = row['month']
  t.month_text = row['month_text']
  t.day = row['day']
  t.day_week = row['day_week']
  t.day_week_text = row['day_week_text']
  t.hour = row['hour']
  t.time_order = row['time_order']
  t.crash_factor = row['crash_factor']
  t.weather = row['weather']
  t.fatals = row['fatals']
  t.drunk = row['drunk']
  t.latitude = row['latitude']
  t.longitude = row['longitude']
  t.county = row['county']
  t.state = row['state']
  t.state_fips = row['state_fips']
  t.county_fips = row['county_fips']
  t.fips = row['fips']
  t.save
  puts "#{t.id} saved"
end
