import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'

//registeration Controller
export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body; // this take data from the body
    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please fill all the fields", success: false });
    }

    const user = await User.findOne({ email }); // check this email allready exist in your db or not
    if (user) {
      return res
        .status(400)
        .json({ message: "This Email already exist", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // create new user

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
        message: "Account created successfully.",
        success: true
    })
  } catch (error) {
    console.error(error);
  }
};


// login Controller
export const login = async (req, res) => {
    try {
        const {email, password, role} = req.body

        if(!email || !password || !role){
            return res.status(400).json({message: "Please fill all the fields", success:false});
        }

        let user = await User.findOne({email});    // let wale user ko baad me change kiya ja skta hai
        if(!user){
            return res.status(400).json({message: "Invalid Credentials", success:false});
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if(!isPasswordMatch){
            return res.status(400).json({message: "Invalid Credentials", success:false});
        }

        //check role is correct or not
        if(role !== user.role){
            return res.status(400).json({message: "Invalid Role", success:false});
        }

        //genrate an token using jwt
        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, {expiresIn: '7d'});

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }
        
        //save the cookie
        return res.status(200).cookie("token", token, {maxAge:7*24*60*60*1000, httpsOnly: true, sameSite: 'strict'}).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true,
        })

    } catch (error) {
        console.log(error)
    }
}


//logout 
export const logout = async(req, res) => {
    try {
        return res.status(200).cookie("token", "", {maxAge:0}).json({
            message: "Logout Successfully",
            success: true,
        })
    } catch (error) {
        console.log(error)
    }
}


//update profile

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body; // this take data from the body
        const file = req.file;

        // if (!fullname || !email || !phoneNumber || !bio || !skills) {
        //   return res
        //     .status(400)
        //     .json({ message: "Please fill all the fields", success: false });
        // }

        //cloudnary ayega idhar

        let skillsArray;
        if(skills){
            skillsArray = skills.split(",");
        }
        const userId = req.id;  //middleware authentication
        let user = await User.findById(userId);

        if(!user){
            return res
            .status(400)
            .json({ message: "User not found", success: false });
        }

        //updating user data
        if(fullname) user.fullname = fullname;
        if(email) user.email = email;
        if(phoneNumber) user.phoneNumber = phoneNumber;
        if(bio) user.bio = bio;
        if(skills) user.skills = skillsArray;

        // user.fullname = fullname;
        // user.email = email;
        // user.phoneNumber = phoneNumber;
        // user.bio = bio;
        // user.skills = skillsArray;

        //resume comes later here

        await user.save()

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message: "Profile updated successfully.",
            user,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
}