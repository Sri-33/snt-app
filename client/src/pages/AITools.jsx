import { useState, useRef, useEffect } from 'react';
import { MessageCircleReply, Package } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import PageHeader, { PAGE_ACCENTS } from '../components/PageHeader';

const MAX_LISTING_IMAGES = 50;

const TABS = [
  { id: 'listing', label: 'Product Listing', icon: 'listing' },
  { id: 'caption', label: 'Instagram Caption', logo: 'instagram' },
  { id: 'copy', label: 'WhatsApp Copy', logo: 'whatsapp' },
  { id: 'autodm', label: 'Auto DM Replies', icon: 'autodm' },
  { id: 'youtube', label: 'YouTube Shorts', logo: 'youtube' },
];

function YoutubeLogo({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FF0000"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      />
    </svg>
  );
}

function InstagramLogo({ className = 'w-4 h-4', gradientId = 'ig-gradient' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FD5949" />
          <stop offset="45%" stopColor="#D6249F" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
      />
    </svg>
  );
}

function WhatsAppLogo({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function TabIcon({ icon }) {
  if (icon === 'listing') {
    return <Package className="w-4 h-4 text-amber-600" strokeWidth={2.25} aria-hidden="true" />;
  }
  if (icon === 'autodm') {
    return <MessageCircleReply className="w-4 h-4 text-fuchsia-600" strokeWidth={2.25} aria-hidden="true" />;
  }
  return null;
}

function TabLabel({ tab }) {
  const hasIcon = tab.logo || tab.icon;

  if (!hasIcon) return tab.label;

  return (
    <span className="inline-flex items-center gap-1.5">
      {tab.logo === 'youtube' && <YoutubeLogo />}
      {tab.logo === 'instagram' && <InstagramLogo gradientId={`ig-gradient-${tab.id}`} />}
      {tab.logo === 'whatsapp' && <WhatsAppLogo />}
      {tab.icon && <TabIcon icon={tab.icon} />}
      {tab.label}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function OutputBox({ output, onCopy }) {
  if (!output) return null;
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-label">Generated Output</h3>
        <button
          type="button"
          onClick={onCopy}
          className="text-xs px-3 py-1.5 bg-ink text-white rounded-md hover:border-gold border border-transparent transition-colors"
        >
          Copy All
        </button>
      </div>
      <pre className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
    </div>
  );
}

export default function AITools() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('listing');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');

  const [listingSareeName, setListingSareeName] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [listingSareeDetails, setListingSareeDetails] = useState('');
  const [listingImages, setListingImages] = useState([]);
  const [listingPreviews, setListingPreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      listingPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [listingPreviews]);

  const [captionName, setCaptionName] = useState('');
  const [captionPrice, setCaptionPrice] = useState('');
  const [captionDetails, setCaptionDetails] = useState('');
  const [copyInput, setCopyInput] = useState('');
  const [autodmPromo, setAutodmPromo] = useState('');
  const [youtubeName, setYoutubeName] = useState('');
  const [youtubePrice, setYoutubePrice] = useState('');
  const [youtubeDetails, setYoutubeDetails] = useState('');

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      showToast('Copied to clipboard');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_LISTING_IMAGES - listingImages.length;
    if (remaining <= 0) {
      showToast('Maximum 50 images allowed', 'warning');
      return;
    }

    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Only ${remaining} more image(s) added (max 50)`, 'warning');
    }

    setListingImages((prev) => [...prev, ...toAdd]);
    setListingPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    setOutput('');
    e.target.value = '';
  };

  const removeListingImage = (index) => {
    URL.revokeObjectURL(listingPreviews[index]);
    setListingImages((prev) => prev.filter((_, i) => i !== index));
    setListingPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearListingImages = () => {
    listingPreviews.forEach((url) => URL.revokeObjectURL(url));
    setListingImages([]);
    setListingPreviews([]);
  };

  const generate = async () => {
    setLoading(true);
    setOutput('');
    try {
      let result;
      switch (activeTab) {
        case 'listing': {
          if (!listingSareeName.trim()) {
            showToast('Please enter saree name', 'error');
            return;
          }
          const formData = new FormData();
          formData.append('sareeName', listingSareeName.trim());
          if (listingPrice.trim()) formData.append('price', listingPrice.trim());
          if (listingSareeDetails.trim()) formData.append('sareeDetails', listingSareeDetails.trim());
          listingImages.forEach((img) => formData.append('images', img));
          result = await api.generateListing(formData);
          break;
        }
        case 'caption': {
          if (!captionName.trim() && !captionPrice.trim() && !captionDetails.trim()) {
            showToast('Enter saree name, price, or details', 'error');
            return;
          }
          result = await api.generateCaption({
            sareeName: captionName.trim(),
            price: captionPrice.trim(),
            sareeDetails: captionDetails.trim(),
          });
          break;
        }
        case 'copy':
          if (!copyInput.trim()) {
            showToast('Please enter a message topic', 'error');
            return;
          }
          result = await api.generateCopy(copyInput.trim());
          break;
        case 'autodm':
          if (!autodmPromo.trim()) {
            showToast('Please enter what you are promoting', 'error');
            return;
          }
          result = await api.generateAutoDm({ promo: autodmPromo.trim() });
          break;
        case 'youtube': {
          if (!youtubeName.trim() && !youtubePrice.trim() && !youtubeDetails.trim()) {
            showToast('Enter saree name, price, or details', 'error');
            return;
          }
          result = await api.generateYoutube({
            sareeName: youtubeName.trim(),
            price: youtubePrice.trim(),
            details: youtubeDetails.trim(),
          });
          break;
        }
        default:
          return;
      }
      setOutput(result.output || '');
    } catch (err) {
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    setOutput('');
  };

  return (
    <div className="space-y-4">
      <PageHeader title="AI Tools" subtitle="Product listings, Instagram, WhatsApp & YouTube" accent="fuchsia" />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchTab(tab.id)}
            className={`shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
              activeTab === tab.id
                ? PAGE_ACCENTS.fuchsia.tab
                : 'bg-white border border-fuchsia-100 text-ink hover:border-fuchsia-300 hover:bg-fuchsia-50'
            }`}
          >
            <TabLabel tab={tab} />
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-4">
        {activeTab === 'listing' && (
          <>
            <div>
              <label className="section-label block mb-2">Saree Name</label>
              <input
                type="text"
                value={listingSareeName}
                onChange={(e) => setListingSareeName(e.target.value)}
                placeholder="e.g. Sungudi Cotton Saree, Premium Soft Silk Saree"
                className="input"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Price (optional)</label>
              <input
                type="text"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="e.g. 899"
                className="input"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Saree Details (optional)</label>
              <textarea
                value={listingSareeDetails}
                onChange={(e) => setListingSareeDetails(e.target.value)}
                placeholder="Paste fabric, colours, border, weave, occasions, product code, SEO keywords… e.g. Premium acrylic cotton, checked pattern, grand zari pallu, 6.30m with blouse, wedding & festive wear, SNTMS002"
                rows={6}
                className="input resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="section-label">Product Photos (optional)</label>
                <span className="text-xs text-muted">{listingImages.length} / {MAX_LISTING_IMAGES}</span>
              </div>
              <p className="text-xs text-muted mb-2">
                Multiple photos = one title per colour + one shared description
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={listingImages.length >= MAX_LISTING_IMAGES}
                className="w-full py-3 border border-dashed border-line rounded-md text-sm text-muted hover:border-gold transition-colors disabled:opacity-50"
              >
                {listingImages.length ? 'Add More Photos' : 'Upload Photos (optional, up to 50)'}
              </button>
              {listingImages.length > 0 && (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {listingPreviews.map((src, i) => (
                      <div key={src} className="relative aspect-square border border-line rounded-md overflow-hidden bg-white">
                        <img src={src} alt={`Saree ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeListingImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-ink text-white text-xs rounded-full leading-none"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          ×
                        </button>
                        <span className="absolute bottom-1 left-1 text-[10px] bg-ink/80 text-white px-1 rounded">
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearListingImages}
                    className="mt-2 text-xs text-warning"
                  >
                    Clear all images
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'caption' && (
          <>
            <div>
              <label className="section-label block mb-2">Saree Name</label>
              <input
                type="text"
                value={captionName}
                onChange={(e) => setCaptionName(e.target.value)}
                placeholder="e.g. Premium Elampillai Mayil Pattu Saree"
                className="input"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Price (optional)</label>
              <input
                type="text"
                value={captionPrice}
                onChange={(e) => setCaptionPrice(e.target.value)}
                placeholder="e.g. 1300"
                className="input"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Description (optional)</label>
              <textarea
                value={captionDetails}
                onChange={(e) => setCaptionDetails(e.target.value)}
                placeholder="Peacock zari weaving, royal colour combinations, contrast border, designer pallu, soft drape…"
                rows={5}
                className="input resize-none"
              />
            </div>
            <p className="text-xs text-muted">
              Fill any combination — name only, price only, or all three. Uses your premium SNT Instagram format with 💬 Comment &quot;SAREE&quot; 🦚 CTAs.
            </p>
          </>
        )}

        {activeTab === 'copy' && (
          <div>
            <label className="section-label block mb-2">What&apos;s the message about?</label>
            <textarea
              value={copyInput}
              onChange={(e) => setCopyInput(e.target.value)}
              placeholder="e.g. Diwali offer 20% off silk sarees"
              rows={3}
              className="input resize-none"
            />
          </div>
        )}

        {activeTab === 'autodm' && (
          <div>
            <label className="section-label block mb-2">What are you promoting?</label>
            <input
              type="text"
              value={autodmPromo}
              onChange={(e) => setAutodmPromo(e.target.value)}
              placeholder="e.g. Samudhrikha Saree, Sungudi Cotton Sarees"
              className="input"
            />
          </div>
        )}

        {activeTab === 'youtube' && (
          <>
            <div>
              <label className="section-label block mb-2">Saree / Offer Name</label>
              <input
                type="text"
                value={youtubeName}
                onChange={(e) => setYoutubeName(e.target.value)}
                placeholder="e.g. Warm Silk Sarees Clearance Sale"
                className="input"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Price (optional)</label>
              <input
                type="text"
                value={youtubePrice}
                onChange={(e) => setYoutubePrice(e.target.value)}
                placeholder="e.g. 750"
                className="input"
              />
            </div>
            <div>
              <label className="section-label block mb-2">Details (optional)</label>
              <textarea
                value={youtubeDetails}
                onChange={(e) => setYoutubeDetails(e.target.value)}
                placeholder="Clearance sale, limited stock, premium silk, new arrival, video topic…"
                rows={4}
                className="input resize-none"
              />
            </div>
            <p className="text-xs text-muted">
              Matches your YouTube format — 🔥 hook, ✅ bullets, WhatsApp link, Instagram handles &amp; subscribe CTA.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="w-full py-3 btn-primary font-semibold disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {loading && <Spinner />}
      {!loading && <OutputBox output={output} onCopy={copyOutput} />}
    </div>
  );
}
