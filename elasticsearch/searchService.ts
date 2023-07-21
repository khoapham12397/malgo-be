import {Client} from "@elastic/elasticsearch";
import { estypes } from '@elastic/elasticsearch';

import dotenv from "dotenv";
import { getAllThreadsContent,getThreadsContentByIds } from "../services/threadService";
dotenv.config();

const cloudId = process.env.ELASTIC_CLOUD_ID||'Malgo:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvOjQ0MyQ3NDE1MDMzZGU3MTM0ZDVkOTg4ZmVkMGYzMTc1YTYxYyRhNjliMGI4NDk5ZTg0YTAzYjRlMjYyNGU3ZDNiYTQzNw=='
const username = process.env.ELASTIC_USERNAME || 'elastic';
const password = process.env.ELASTIC_PASSWORD ||'2qMH0bUO5wqGfPsKG7nK3miH';
const apiKeyManageThread = process.env.ELASTIC_MANAGE_THREAD_API_KEY || 'OGdTc1Y0a0J1U09UNV9ENVZNMWc6bTFxTWhvdVFST3FSZzRnUmdUcDhUZw==';

const client = new Client({
    cloud: {
        id: cloudId
    },
    auth: {
        username: username,
        password: password,
    }
});



export const generateApiKeys = async (index: string) => {
    const client = new Client({
        cloud: {
            id: cloudId,
        },
        auth: {
            username: username,
            password: password,
        }
    })    

    const { body } = await client.security.createApiKey({
      body: {
        name: 'manage_'+index,
        role_descriptors: {
          'nodejs_example_writer': {
            'cluster': ['monitor'],
            'index': [
              {
                'names': ['index'],
                'privileges': ['create_index', 'write', 'read', 'manage']
              }
            ]
          }
        }
      }
    })
  
    return Buffer.from(`${body.id}:${body.api_key}`).toString('base64')
}
// 3 thu dung => id, title, content , authorId dun ://
// co ban la vay d://a:

export type ThreadElastic ={
    id: string;
    title: string;
    content: string;
    authorId: string;
}

export const addThreadToElastic = async (param: ThreadElastic)=>{
    try {
        const result = await client.index({
        index: 'thread',
        id: param.id,
        body: {
            id : param.id,
            content: param.content,
            title: param.title,
            authorId: param.authorId,
        }
        });
        return result;
    }
    catch(error) {
        console.log(error);
    }
}
export const searchSimilarThread = async (content: string) =>{
    try{
        const result = await client.search({
            index: 'thread',
            body:{
                query: {
                    match : {
                        content: content,
                    }
                }
            }
        });
        return result.body.hits.hits.map((item :any) => item._source);
    }
    catch(error){
        console.log(error);
        throw error;
    }
}
export const getThreadContentById = async(threadId : string)=>{
    try{
        
        const result = await client.get({
            index: 'thread',
            id: threadId,
        });
        console.log(result.body);
        
    }catch(error){
        console.log(error);
    }
}

export const deleteThreadById = async(threadId: string) =>{
    try{
        console.log('delete thread: '+ threadId);
        const result = await client.delete({
            index: 'thread',
            id: threadId,
        });
        console.log(result.body);
        
    }catch(error){
        console.log(error);
    } 
} 


export const saveThreadsFromDBToElastic = async ()=>{
    try{
        const threads = await getAllThreadsContent();
        
        const operations = threads.flatMap(doc => [{ index: { _index: 'thread',_id: doc.id } }, doc]);
        const bulkResponse = await client.bulk({
            refresh : true, 
            body: operations,
        });
        console.log(bulkResponse);
        const count = await client.count({ index: 'thread' })
        console.log(count);
        
    }
    catch(error){
        console.log(error);
    }
}
export const saveThreadsFromDBToElasticByIdList = async (ids: Array<string>) =>{
    try{
        const threads = await getThreadsContentByIds(ids);
        
        const operations = threads.flatMap(doc => [{ index: { _index: 'thread',_id: doc.id } }, doc]);
        const bulkResponse = await client.bulk({
            refresh : true, 
            body: operations,
        });
        console.log(bulkResponse);
        const count = await client.count({ index: 'thread' })
        console.log(count);
        
    }
    catch(error){
        console.log(error);
    }
}
export const deleteAllThread = async()=>{
    try{
        const response = await client.deleteByQuery({
            index : 'thread',
            body: {
                query: {
                    match_all : {}
                }
            }
        });

        console.log(response);
        await client.count({index: 'thread'});
        
    }catch(error){
        console.log(error);
    }
}
export const createThreadIndex = async () =>{
    console.log("create thread index");
    
    const client = new Client({
        cloud: {id: cloudId},
        auth:{
            username :username,
            password : password,
        } 
    });
    

    const response = await client.indices.create({
        index: 'thread',
        body: {
            mappings: {
                properties: {
                    id: { type: 'text' },
                    content: { type: 'text' }
                }
            }
        }
          
    },{ignore :[400]});
    console.log(response.body);
}
export default client;


