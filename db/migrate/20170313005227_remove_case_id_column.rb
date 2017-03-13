class RemoveCaseIdColumn < ActiveRecord::Migration[5.0]
  def change
    remove_column :crashes, :case_id, :integer
  end
end
