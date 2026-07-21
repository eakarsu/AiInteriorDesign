const express=require('express');
const prisma=require('../src/config/database');
const {authenticateToken}=require('../src/middleware/auth');
const {createWorkflow}=require('./workflowCore');
const {createGovernedRouter}=require('./routerFactory');
const query=(client,sql,params)=>client.$queryRawUnsafe(sql,...params);
const db={query:(sql,params)=>query(prisma,sql,params),transaction:work=>prisma.$transaction(tx=>work((sql,params)=>query(tx,sql,params)))};
module.exports=createGovernedRouter({express,workflow:createWorkflow(require('./config')),auth:authenticateToken,db});
