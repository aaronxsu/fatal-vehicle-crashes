class AddCaseIdColumn < ActiveRecord::Migration[5.0]
  def change
    add_column :crashes, :case_id, :integer
  end
end
