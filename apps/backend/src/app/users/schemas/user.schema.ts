import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ default: null })
  password!: string | null;

  @Prop({ default: null })
  googleId!: string | null;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ default: null })
  emailVerificationToken!: string | null;

  @Prop({ default: null })
  emailVerificationExpires!: Date | null;

  @Prop({ default: null })
  deletionRequestedAt!: Date | null;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
