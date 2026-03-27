import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, default: null })
  password!: string | null;

  @Prop({ type: String, default: null })
  googleId!: string | null;

  @Prop({ type: String, default: null })
  avatarUrl!: string | null;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: String, default: null })
  emailVerificationToken!: string | null;

  @Prop({ type: Date, default: null })
  emailVerificationExpires!: Date | null;

  @Prop({ type: Date, default: null })
  deletionRequestedAt!: Date | null;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
