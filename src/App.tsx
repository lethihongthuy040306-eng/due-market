import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Search, ShoppingBag, Plus, BookOpen, Laptop, Shirt, House, Pencil,
  Recycle, SlidersHorizontal, LogIn, LogOut, UserRound, X, Trash2,
  MapPin, Mail, ShieldCheck, PackageOpen, ArrowUpDown, AlertCircle
} from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Listing = {
  id: string
  user_id: string
  title: string
  description: string
  price_vnd: number
  category: string
  condition: string
  image_url: string | null
  contact_hint: string | null
  status: string
  created_at: string
}
const categories = ['Tất cả', 'Giáo trình', 'Điện tử', 'Đồ dùng học tập', 'Thời trang', 'Đồ gia dụng', 'Khác']
const money = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const categoryIcon = (c: string) => {
  if (c === 'Giáo trình') return <BookOpen size={17}/>
  if (c === 'Điện tử') return <Laptop size={17}/>
  if (c === 'Thời trang') return <Shirt size={17}/>
  if (c === 'Đồ gia dụng') return <House size={17}/>
  return <Pencil size={17}/>
}
const placeholders = [
  {title:'Giáo trình Kinh tế chính trị',price_vnd:45000,category:'Giáo trình',condition:'Đã qua sử dụng',emoji:'📚'},
  {title:'Máy tính Casio fx-580VN X',price_vnd:320000,category:'Điện tử',condition:'Đã qua sử dụng',emoji:'🧮'},
  {title:'Balo đi học chống nước',price_vnd:90000,category:'Thời trang',condition:'Đã qua sử dụng',emoji:'🎒'},
  {title:'Đèn học LED để bàn',price_vnd:65000,category:'Đồ gia dụng',condition:'Mới',emoji:'💡'},
  {title:'Sổ tay ghi chép A5',price_vnd:18000,category:'Đồ dùng học tập',condition:'Mới',emoji:'📒'},
  {title:'Sách tiếng Anh giao tiếp',price_vnd:55000,category:'Giáo trình',condition:'Đã qua sử dụng',emoji:'📖'},
]
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [maxPrice, setMaxPrice] = useState('all')
  const [condition, setCondition] = useState('Tất cả')
  const [sort, setSort] = useState('new')
  const [authOpen, setAuthOpen] = useState(false)
  const [listingOpen, setListingOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [form, setForm] = useState({title:'',price:'',category:'Giáo trình',condition:'Đã qua sử dụng',description:'',image_url:''})

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return }
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setAuthReady(true) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setAuthReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadListings() {
    if (!supabase) { setListings([]); return }
    setLoading(true)
    const {data,error} = await supabase.from('listings').select('*').eq('status','active').order('created_at',{ascending:false}).limit(100)
    if (error) setNotice('Không tải được tin đăng: ' + error.message)
    else setListings((data || []) as Listing[])
    setLoading(false)
  }
  useEffect(() => { if (isSupabaseConfigured) void loadListings() }, [])

  const visible = useMemo(() => listings.filter(p => {
    const q = search.trim().toLocaleLowerCase('vi')
    return (category === 'Tất cả' || p.category === category)
      && (condition === 'Tất cả' || p.condition === condition)
      && (maxPrice === 'all' || p.price_vnd <= Number(maxPrice))
      && (p.title + ' ' + p.description + ' ' + p.category).toLocaleLowerCase('vi').includes(q)
  }).sort((a,b) => sort === 'cheap' ? a.price_vnd-b.price_vnd : sort === 'expensive' ? b.price_vnd-a.price_vnd : new Date(b.created_at).getTime()-new Date(a.created_at).getTime()), [listings,search,category,condition,maxPrice,sort])

  function notify(message: string) { setNotice(message); window.setTimeout(() => setNotice(''), 6000) }

  async function submitAuth(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true); setNotice('')
    try {
      if (authMode === 'signup') {
        const {data,error} = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { data: { display_name: displayName.trim() || 'Sinh viên DUE' } }
        })
        if (error) throw error
        if (!data.session) notify('Đã gửi yêu cầu đăng ký. Hãy kiểm tra email để xác nhận tài khoản trước khi đăng nhập.')
        else notify('Tạo tài khoản thành công!')
        setAuthOpen(false)
      } else {
        const {error} = await supabase.auth.signInWithPassword({email:authEmail.trim(),password:authPassword})
        if (error) throw error
        setAuthOpen(false); notify('Đăng nhập thành công!')
      }
    } catch (err) { notify(err instanceof Error ? err.message : 'Có lỗi khi xác thực tài khoản.') }
    finally { setBusy(false) }
  }

  async function signOut() {
    if (!supabase) return
    const {error} = await supabase.auth.signOut()
    if (error) notify(error.message); else notify('Bạn đã đăng xuất.')
  }

  async function createListing(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !session?.user) { setAuthOpen(true); setAuthMode('login'); return }
    setBusy(true)
    const price = Number(form.price)
    if (!Number.isSafeInteger(price) || price < 1000) { notify('Giá bán phải từ 1.000đ trở lên.'); setBusy(false); return }
    const {error} = await supabase.from('listings').insert({
      user_id:session.user.id,
      title:form.title.trim(),
      description:form.description.trim(),
      price_vnd:price,
      category:form.category,
      condition:form.condition,
      image_url:form.image_url.trim() || null,
      status:'active'
    })
    setBusy(false)
    if (error) { notify('Chưa đăng được tin: ' + error.message); return }
    setListingOpen(false)
    setForm({title:'',price:'',category:'Giáo trình',condition:'Đã qua sử dụng',description:'',image_url:''})
    notify('Đăng tin thành công!')
    void loadListings()
  }

  async function deleteListing(id: string) {
    if (!supabase || !confirm('Bạn có chắc muốn xóa tin đăng này?')) return
    const {error} = await supabase.from('listings').delete().eq('id',id)
    if (error) notify('Không thể xóa tin: ' + error.message)
    else { notify('Đã xóa tin đăng.'); void loadListings() }
  }

  const configured = isSupabaseConfigured
  return <div className="app">
    <div className="topline">CHỢ SINH VIÊN DUE <span>·</span> Mua bán tiết kiệm, sử dụng bền vững</div>
    <header className="header"><div className="nav">
      <a className="brand" href="#"><span className="brand-mark"><ShoppingBag size={22}/></span><span>DUE <b>Market</b><small>CHỢ SINH VIÊN</small></span></a>
      <label className="searchbox"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm giáo trình, máy tính, balo..."/></label>
      <div className="nav-actions">
        {session ? <><span className="user-chip"><UserRound size={16}/>{session.user.email}</span><button className="btn ghost smallbtn" onClick={signOut}><LogOut size={16}/> Đăng xuất</button></> :
          <button className="btn ghost" onClick={()=>{setAuthMode('login');setAuthOpen(true)}}><LogIn size={17}/> Đăng nhập</button>}
        <button className="btn primary" onClick={()=>session?setListingOpen(true):(setAuthMode('login'),setAuthOpen(true))}><Plus size={18}/> Đăng tin</button>
      </div>
    </div></header>
    <main className="container">
      {!configured && <div className="setup-alert"><AlertCircle size={21}/><div><b>Website chưa kết nối Supabase</b><p>Đây là mã nguồn đã chuẩn bị. Để đăng nhập và lưu dữ liệu thật, hãy cấu hình <code>.env</code>, chạy <code>supabase/schema.sql</code> và deploy theo file README. Chưa có URL công khai ở giai đoạn này.</p></div></div>}
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="dot"></span> NỀN TẢNG MUA BÁN SINH VIÊN</div>
          <h1>Món đồ hữu ích,<br/><em>giá tốt</em> cho sinh viên.</h1>
          <p>Mua bán giáo trình và đồ dùng học tập trong cộng đồng sinh viên. Tiết kiệm ngân sách, tìm món đồ phù hợp và cho đồ cũ một vòng đời mới.</p>
          <div className="hero-buttons"><button className="btn primary large" onClick={()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'})}>Khám phá sản phẩm <span>↗</span></button><button className="btn light large" onClick={()=>session?setListingOpen(true):(setAuthMode('signup'),setAuthOpen(true))}><Plus size={17}/> Bắt đầu bán hàng</button></div>
          <div className="trustline"><ShieldCheck size={16}/> Cộng đồng sinh viên · Giá hiển thị bằng VNĐ</div>
        </div>
        <div className="hero-visual" aria-label="Đồ dùng học tập"><div className="orbit orbit1"></div><div className="orbit orbit2"></div><div className="float-card book">📚<small>Giáo trình</small></div><div className="float-card calc">🧮<small>Máy tính</small></div><div className="float-card bag">🎒<small>Balo</small></div><div className="hero-center"><Recycle size={38}/><b>Reuse more.</b><small>Spend smarter.</small></div></div>
      </section>
      <section className="quick-stats"><div><span className="stat-icon"><PackageOpen size={20}/></span><p><b>{listings.length}</b><small>Tin đăng đang hoạt động</small></p></div><div><span className="stat-icon"><Recycle size={20}/></span><p><b>Reuse & save</b><small>Ưu tiên tái sử dụng</small></p></div><div><span className="stat-icon"><ShieldCheck size={20}/></span><p><b>Cộng đồng DUE</b><small>Kết nối người mua và bán</small></p></div></section>
      <section className="market-section" id="products">
        <div className="section-title"><div><span className="eyebrow">DÀNH CHO BẠN</span><h2>Khám phá sản phẩm</h2><p>Tìm món đồ phù hợp với nhu cầu và ngân sách của bạn.</p></div><div className="results">{visible.length} kết quả <ArrowUpDown size={15}/></div></div>
        <div className="category-row">{categories.map(c=><button key={c} className={'category-pill '+(category===c?'selected':'')} onClick={()=>setCategory(c)}>{c!=='Tất cả'&&categoryIcon(c)}{c}</button>)}</div>
        <div className="market-layout"><aside className="filter-panel"><div className="filter-title"><SlidersHorizontal size={17}/><b>Bộ lọc</b></div>
          <label>Danh mục<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
          <label>Tình trạng<select value={condition} onChange={e=>setCondition(e.target.value)}><option>Tất cả</option><option>Mới</option><option>Đã qua sử dụng</option></select></label>
          <label>Giá tối đa<select value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}><option value="all">Không giới hạn</option><option value="50000">50.000đ</option><option value="100000">100.000đ</option><option value="200000">200.000đ</option><option value="350000">350.000đ</option></select></label>
          <button className="clear-filters" onClick={()=>{setCategory('Tất cả');setCondition('Tất cả');setMaxPrice('all');setSearch('');setSort('new')}}>Xóa bộ lọc</button>
          <div className="safe-box"><ShieldCheck size={18}/><b>Mua bán an toàn</b><p>Kiểm tra sản phẩm và thống nhất giao nhận rõ ràng trước khi thanh toán.</p></div>
        </aside>
        <div className="product-area"><div className="sort-row"><span>{loading?'Đang tải tin đăng...':configured?'Tin đăng từ cộng đồng':'Sản phẩm minh họa'}</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Mới nhất</option><option value="cheap">Giá thấp đến cao</option><option value="expensive">Giá cao đến thấp</option></select></div>
          {!configured ? <div className="empty-state"><PackageOpen size={34}/><h3>Chưa có dữ liệu trực tuyến</h3><p>Kết nối Supabase để tải tin đăng thật. Các sản phẩm minh họa được dùng trong bản demo trước đó.</p></div> :
            visible.length===0 ? <div className="empty-state"><Search size={34}/><h3>Chưa có sản phẩm phù hợp</h3><p>Hãy thử đổi từ khóa hoặc bộ lọc.</p></div> :
            <div className="product-grid">{visible.map(p=><article className="product-card" key={p.id}>
              <div className="product-photo">{p.image_url?<img src={p.image_url} alt={p.title} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>:<span className="product-emoji">{p.category==='Giáo trình'?'📚':p.category==='Điện tử'?'🧮':p.category==='Thời trang'?'🎒':p.category==='Đồ gia dụng'?'💡':'✏️'}</span>}<span className="condition-tag">{p.condition}</span></div>
              <div className="product-info"><span className="product-category">{p.category}</span><h3>{p.title}</h3><p className="description">{p.description||'Sản phẩm đăng bởi cộng đồng sinh viên.'}</p><div className="price">{money(p.price_vnd)}</div><div className="product-meta"><span><MapPin size={13}/> Đà Nẵng</span><span><UserRound size={13}/>{p.user_id===session?.user.id?'Tin của bạn':'Sinh viên DUE'}</span></div>
                <div className="product-actions">{p.user_id===session?.user.id?<button className="btn danger-soft" onClick={()=>void deleteListing(p.id)}><Trash2 size={15}/> Xóa tin</button>:<button className="btn primary full" onClick={()=>notify('Để bảo vệ riêng tư, chức năng nhắn tin sẽ được bổ sung ở phiên bản tiếp theo.')}><Mail size={15}/> Liên hệ người bán</button>}</div>
              </div>
            </article>)}</div>}
        </div></div>
      </section>
      <section className="sell-banner"><div className="sell-icon"><ShoppingBag size={30}/></div><div><h2>Bạn có món đồ không còn dùng?</h2><p>Đăng tin để kết nối với sinh viên đang cần món đồ đó.</p></div><button className="btn primary large" onClick={()=>session?setListingOpen(true):(setAuthMode('signup'),setAuthOpen(true))}>Đăng tin miễn phí <Plus size={17}/></button></section>
      <div className="footnote"><ShieldCheck size={16}/><span>DUE Market là dự án độc lập phục vụ học tập, không phải cổng chính thức của Trường Đại học Kinh tế – Đại học Đà Nẵng. Kiểm tra sản phẩm và người bán trước mọi giao dịch.</span></div>
    </main>
    <footer><div className="footer-inner"><a className="brand footer-brand" href="#"><span className="brand-mark"><ShoppingBag size={20}/></span><span>DUE <b>Market</b><small>CHỢ SINH VIÊN</small></span></a><span>Mua thông minh · Bán dễ dàng · Kết nối sinh viên</span><span>© {new Date().getFullYear()} DUE Market · Bản thử nghiệm</span></div></footer>
    {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Đóng thông báo"><X size={15}/></button></div>}
    {authOpen && <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}><section className="dialog">
      <button className="dialog-close" onClick={()=>setAuthOpen(false)} aria-label="Đóng"><X size={19}/></button>
      <div className="dialog-logo"><ShoppingBag size={25}/></div><span className="eyebrow">CỘNG ĐỒNG DUE</span><h2>{authMode==='login'?'Chào mừng trở lại!':'Tạo tài khoản DUE Market'}</h2><p className="dialog-sub">{authMode==='login'?'Đăng nhập để đăng tin và quản lý sản phẩm.':'Đăng ký bằng email để bắt đầu mua bán.'}</p>
      <form onSubmit={submitAuth} className="dialog-form">
        {authMode==='signup'&&<label> Tên hiển thị<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Tên bạn muốn hiển thị" maxLength={60}/></label>}
        <label>Email<input type="email" autoComplete="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="ban@example.com"/></label>
        <label>Mật khẩu<input type="password" autoComplete={authMode==='login'?'current-password':'new-password'} minLength={6} required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Ít nhất 6 ký tự"/></label>
        <button className="btn primary full large" disabled={busy||!configured}>{busy?'Đang xử lý...':authMode==='login'?'Đăng nhập':'Tạo tài khoản'}</button>
        {!configured&&<small className="form-hint">Cần kết nối Supabase trước khi xác thực hoạt động.</small>}
      </form>
      <p className="switch-auth">{authMode==='login'?'Chưa có tài khoản?':'Đã có tài khoản?'} <button onClick={()=>setAuthMode(authMode==='login'?'signup':'login')}>{authMode==='login'?'Đăng ký':'Đăng nhập'}</button></p>
      <p className="privacy-hint"><ShieldCheck size={14}/> Không chia sẻ mật khẩu hoặc mã xác nhận với người khác.</p>
    </section></div>}
    {listingOpen && <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setListingOpen(false)}}><section className="dialog listing-dialog">
      <button className="dialog-close" onClick={()=>setListingOpen(false)} aria-label="Đóng"><X size={19}/></button><span className="eyebrow">BÁN ĐỒ CŨ · TẠO GIÁ TRỊ MỚI</span><h2>Đăng tin sản phẩm</h2><p className="dialog-sub">Mô tả rõ tình trạng và giá bán để người mua dễ lựa chọn.</p>
      <form onSubmit={createListing} className="dialog-form">
        <label>Tên sản phẩm *<input required minLength={3} maxLength={100} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ví dụ: Giáo trình Kinh tế vi mô"/></label>
        <div className="two-col"><label>Giá bán (VNĐ) *<input required type="number" min="1000" max="1000000000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="50000"/></label><label>Danh mục<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.filter(c=>c!=='Tất cả').map(c=><option key={c}>{c}</option>)}</select></label></div>
        <label>Tình trạng<select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}><option>Đã qua sử dụng</option><option>Mới</option></select></label>
        <label>Mô tả<textarea rows={3} maxLength={2000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Mô tả tình trạng, phụ kiện, lưu ý..."/></label>
        <label>Link ảnh sản phẩm (không bắt buộc)<input type="url" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..."/></label>
        <button className="btn primary full large" disabled={busy||!configured}>{busy?'Đang đăng...':'Đăng tin sản phẩm'}</button>
      </form>
      <p className="privacy-hint"><ShieldCheck size={14}/> Bạn chỉ có thể xóa tin đăng do chính mình tạo.</p>
    </section></div>}
  </div>
}