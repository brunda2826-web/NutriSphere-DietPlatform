import mongoose from 'mongoose';
const s=new mongoose.Schema({
 user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},fullName:{type:String,required:true},phone:{type:String,required:true},addressLine1:{type:String,required:true},addressLine2:String,landmark:String,city:{type:String,required:true},state:{type:String,required:true},postalCode:{type:String,required:true},country:{type:String,default:'India'},latitude:{type:Number,required:true},longitude:{type:Number,required:true},label:{type:String,enum:['Home','Work','Other'],default:'Home'},isDefault:{type:Boolean,default:false},distanceKm:Number
},{timestamps:true});
export default mongoose.model('Address',s);
