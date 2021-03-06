import Account from './Account';

export default class UserAccount extends Account {
  contactPhone;
  contactAddress;

  static create({
    userName,
    password,
    ...others}) {
    if (!userName) {
      throw Error('用户名不能为空');
    }
    if (!password || password.length < 5) {
      throw Error('密码不能少于5位');
    }
    const userAccount = new UserAccount;
    userAccount.raiseEvent('accountCreated', {
      userName,
      password,
      ...others
    });
    return userAccount;
  }

  updateAddress(address){
    if (!address) {
      throw Error('地址不能为空');
    }
    this.raiseEvent('addressUpdated', {
      userName:this.userName,
      address
    });
  }

  updateEmail(email){
      if (!email) {
        throw Error('email不能为空');
      }
      this.raiseEvent('emailUpdated', {
        userName:this.userName,
        email
      });
  }

  when({
    name,
    data
  }) {
    //console.log('when', name, JSON.stringify( data));
  }

  accountCreated({
    contactPhone,
    userName,
    password,
    displayName,
    email,
    ...contactAddress
  }) {
    this.userName = userName;
    this.password = password;
    this.displayName = displayName;
    this.email = email;
    this.contactPhone = contactPhone;
    this.contactAddress = contactAddress;
  }

  addressUpdated({address}){
      this.contactAddress = address;
  }

  emailUpdated({email}){
    this.email = email;
  }
}
