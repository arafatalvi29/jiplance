'use client'
import { useEffect,useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from "../lib/supabase";
export default function Dashboard(){
 const router=useRouter(); const [products,setProducts]=useState<any[]>([]); const [role,setRole]=useState(''); const [msg,setMsg]=useState('');
 const [form,setForm]=useState({title:'',slug:'',price:'',stock:'0',age_group:'3–10',description:'',image_url:''})
 const load=async()=>{const {data}=await supabase.from('products').select('*').order('created_at',{ascending:false});setProducts(data||[])}
 useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){router.push('/login');return}const {data}=await supabase.from('profiles').select('role').eq('id',user.id).single();if(!data){setMsg('No team role found. Ask the Owner to add your role.');return}setRole(data.role);await load()})()},[])
 const save=async(e:any)=>{e.preventDefault();if(!['owner','admin'].includes(role)){setMsg('Only Owner/Admin can add products.');return}const slug=form.slug||form.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');const {error}=await supabase.from('products').insert([{...form,slug,price:Number(form.price),stock:Number(form.stock)}]);if(error){setMsg(error.message);return}setMsg('Product added successfully.');setForm({title:'',slug:'',price:'',stock:'0',age_group:'3–10',description:'',image_url:''});load()}
 const remove=async(id:string)=>{if(!confirm('Delete this product?'))return;const {error}=await supabase.from('products').delete().eq('id',id);if(error)setMsg(error.message);else load()}
 const logout=async()=>{await supabase.auth.signOut();router.push('/')}
 return <main className="dash"><h1>JIPLANCE MANAGEMENT</h1><p>Role: <b>{role||'Loading...'}</b></p><button onClick={logout}>Log out</button><p>{msg}</p><h2>Add Product</h2><form onSubmit={save}>{Object.entries(form).map(([k,v])=><input key={k} placeholder={k.replace('_',' ')} value={v} onChange={e=>setForm({...form,[k]:e.target.value})}/>)}<button>Add Product</button></form><h2>Products</h2>{products.map(p=><div className="row" key={p.id}><span>{p.title} — ৳{p.price} — Stock: {p.stock}</span>{['owner','admin'].includes(role)&&<button onClick={()=>remove(p.id)}>Delete</button>}</div>)}</main>
}
