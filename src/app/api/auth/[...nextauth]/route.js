import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('\n🔑 Authorization attempt for:', credentials.email);
          console.log('Received credentials:', {
            email: credentials.email,
            isAdmin: credentials.isAdmin
          });

          await connectDB();
          const user = await User.findOne({ email: credentials.email }).select('+password');
          
          if (!user) {
            console.log('❌ User not found in database');
            return null;
          }

          console.log('🔍 Found user:', {
            id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
            passwordHash: user.password.substring(0, 10) + '...' // Show partial hash
          });

          console.log('🔐 Comparing password...');
          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log('🔑 Password comparison result:', isValid);

          if (!isValid) {
            console.log('❌ Invalid password');
            return null;
          }

          if (!user.isVerified) {
            console.log('⚠️ User not verified');
            throw new Error('Please verify your email first');
          }

          if (credentials.isAdmin && !user.isAdmin) {
            console.log('⛔ Admin access denied for non-admin user');
            throw new Error('Admin access denied');
          }

          console.log('✅ Authentication successful');
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
          };
        } catch (error) {
          console.error('🔥 Authorization error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login'
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };