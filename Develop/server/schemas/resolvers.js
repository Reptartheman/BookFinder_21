const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-_v-password")
          .populate("savedBooks");

        return userData;
      }

      throw new AuthenticationError("Not logged in");
    },
  },

  Mutation: {
    addUser: async (parents, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parents, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Wrong credentials");
      }

      const correctPw = await user.inCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Wrong credentials");
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parents, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: args },
          { new: true, runValidators: true }
        ).populate("savedBooks");

        return updatedUser;
      }

      throw new AuthenticationError("Please login");
    },
  },
};

module.exports = resolvers;
