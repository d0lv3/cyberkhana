import mongoose, { Schema, Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  code: string;
  description?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model<IUniversity>('University', UniversitySchema);
