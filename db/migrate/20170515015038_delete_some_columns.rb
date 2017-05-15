class DeleteSomeColumns < ActiveRecord::Migration[5.0]
  def change
    remove_column :crashes, :state_fips, :integer
    remove_column :crashes, :county_fips, :integer
  end
end
