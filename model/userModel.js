const BaseSQLModel = require("./baseSQLModel");

// Create a new class for a specific table
class UserModel extends BaseSQLModel {

  constructor() {
    super("users"); //table 'users'
  }

  speak() {
    console.log("Hello!");
  }

  async getUserByEmail(email) {
    const results =  await this.findByKey('email', email);
    return results;
  }


}

const UserDB = new UserModel();

module.exports = UserDB;

