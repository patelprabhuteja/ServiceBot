const express=require("express");
var app=express();

const bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const {WebhookClient,Payload}=require("dialogflow-fulfillment");

const MongoClient=require("mongodb").MongoClient;
const url="mongodb://127.0.0.1:27017";

MongoClient.connect(url,{useUnifiedTopology: true},(err,client)=>{
    if(err){
        console.log("Error connecting to Database");
        return;
    }
    db=client.db("project2");
    console.log("Connection Successfull with the Database");
});

async function getUser(agent){
    const query={"mobileNo":agent.parameters.mobileNo};
    const dbResult=await db.collection("users").findOne(query);
    if(dbResult==null){
        await agent.add("Mobile Number not registered.");
    }
    else{
        await agent.add(`Hello ${dbResult["name"]}, Please describe your issue.`);
    }
}
async function addIssue(agent){
    const issue=agent.parameters.issueWith;
    const mobile=agent.parameters.mobileNo;
    const status="pending";
    let ticketId="";
    const date=String(new Date()).slice(4,24);
    let temp="abcdefghijklmnopqrstuvwxyz0123456789";
    for(let i=0;i<Math.floor(Math.random()*(10-8+1)+8);i++){
        ticketId+=temp.charAt(Math.floor(Math.random()*temp.length));
    }
    await db.collection("issues").insertOne({"mobile": mobile,"issue": `Issue with ${issue}`,"time": date,"status": status,"ticketId": ticketId});
    await agent.add(`Your issue will be resolved soon. Please note the ticket Id - ${ticketId}.`);
}
async function createUser(agent){
    const uname=agent.parameters.username;
    const mobileNo=agent.parameters.mobileNo;
    const query={"mobileNo":mobileNo};
    const dbResult=await db.collection("users").findOne(query);
    if(dbResult==null){
        await db.collection("users").insertOne({"name":uname,"mobileNo":mobileNo});
        await agent.add("You are successfully registered.");
    }
    else{
        await agent.add(`Mobile Number already registered.`);
    }
}

app.post("/",express.json(),(req,res)=>{
    const agent=new WebhookClient({
        request: req,
        response: res
    });
    let intentMap=new Map();
    intentMap.set("getuser",getUser);
    intentMap.set("addIssue",addIssue);
    intentMap.set("createUser",createUser);
    agent.handleRequest(intentMap);
});

app.listen(3000);