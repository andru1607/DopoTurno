'use strict';
const {config,json,method}=require('./cloud-server');
module.exports=async function handler(req,res){
 if(!method(req,res,['GET']))return;
 json(res,200,{configured:!!config(),mode:config()?'online':'local'});
};
