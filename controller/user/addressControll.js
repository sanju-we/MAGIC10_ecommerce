const HttpStatus = require('../../config/httpStatusCode')
const Address = require('../../models/addressSchema')
const User = require('../../models/userSchema')

const showAddAddress = async (req, res) => {
  try {
    const userId = req.session.user
    const userData = await User.findById(userId)

    const addresses = await Address.findOne({ userId: userId })
    console.log('addresses:', addresses);

    res.render('userAddress', { addresses, user:userData })
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const loadAddAddress = async (req, res) => {
  try {
    const userId = req.session.user
    const addressData = await Address.findOne({ userId: userId })
    res.render('addAddress', { user: userId, addressData })
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const AddAddress = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized: No user session" });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const { fullName, phone, street, city, LandMark, PINcode, State, addressType } = req.body;
    let userAddress = await Address.findOne({ userId });

    if (!userAddress) {
      userAddress = new Address({
        userId: userData._id,
        address: [{ addressType, fullName, phone, street, city, LandMark, PINcode, State }]
      });
    } else {
      userAddress.address.push({ addressType, fullName, phone, street, city, LandMark, PINcode, State });
    }

    await userAddress.save();

    console.log("Address saved successfully:", userAddress);

    res.redirect('/userProfile');
  } catch (error) {
    console.error("Error occurred while adding address:", error);
    res.redirect('/pageNotFound');
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { addressId } = req.params;
    const userAddressDoc = await Address.findOne({ userId });
    if (!userAddressDoc) {
      return res.redirect('/pageNotFound');
    }
    const addressData = userAddressDoc.address.find(
      (addr) => addr._id.toString() === addressId
    );
    if (!addressData) {
      return res.redirect('/pageNotFound');
    }
    res.render('editAddress', { user: userId, addressData });
  } catch (error) {
    console.error("Error loading edit address:", error);
    res.redirect('/pageNotFound');
  }
};

const editAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { addressId } = req.params;

    const userAddressDoc = await Address.findOne({ userId });

    if (!userAddressDoc) {
      return res.redirect('/pageNotFound');
    }

    const addressIndex = userAddressDoc.address.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.redirect('/pageNotFound');
    }

    userAddressDoc.address[addressIndex] = {
      ...userAddressDoc.address[addressIndex],
      fullName: req.body.fullName,
      phone: req.body.phone,
      street: req.body.street,
      city: req.body.city,
      LandMark: req.body.LandMark,
      PINcode: req.body.PINcode,
      State: req.body.State,
      addressType: req.body.addressType,
    };

    await userAddressDoc.save();
    console.log("Address updated successfully:", userAddressDoc.address[addressIndex]);
    res.redirect(`/userProfile/address/${userId}`);
  } catch (error) {
    console.error("Error occurred while editing address:", error);
    res.redirect('/pageNotFound');
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user; 
    const { addressId } = req.params; 

    const userAddressDoc = await Address.findOne({ userId });

    if (!userAddressDoc) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "User address not found" });
    }

    const updatedAddresses = userAddressDoc.address.filter(
      (addr) => addr._id.toString() !== addressId
    );

    if (updatedAddresses.length === userAddressDoc.address.length) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Address not found" });
    }

    userAddressDoc.address = updatedAddresses;
    await userAddressDoc.save();

    res.status(HttpStatus.OK).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
}

const loadAddAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.user
    const addressData = await Address.findOne({ userId: userId })
    res.render('addAddressCheckout', { user: userId, addressData })
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const AddAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.user;
console.log('working')
    if (!userId) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Unauthorized: No user session" });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: "User not found" });
    }

    const { fullName, phone, street, city, LandMark, PINcode, State, addressType } = req.body;
    let userAddress = await Address.findOne({ userId });

    if (!userAddress) {
      userAddress = new Address({
        userId: userData._id,
        address: [{ addressType, fullName, phone, street, city, LandMark, PINcode, State }]
      });
    } else {
      userAddress.address.push({ addressType, fullName, phone, street, city, LandMark, PINcode, State });
    }

    await userAddress.save();

    console.log("Address saved successfully:", userAddress);

    res.redirect('/checkout');
  } catch (error) {
    console.error("Error occurred while adding address:", error);
    res.redirect('/pageNotFound');
  }
};




module.exports = {
  loadAddAddress,
  showAddAddress,
  AddAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  loadAddAddressCheckout,
  AddAddressCheckout
}