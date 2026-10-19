'use client';

import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Sparkles,
  Link as LinkIcon,
  DollarSign,
  Upload,
  Loader2,
  Check,
  Package,
} from 'lucide-react';

export default function AddProductModal({
  isOpen,
  onClose,
  collections = [],
  onAddProduct,
}) {
  const [productUrl, setProductUrl] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [collection, setCollection] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState('');

  if (!isOpen) return null;

  const handleScrape = async () => {
    if (!productUrl.trim()) return;
    setIsScraping(true);
    setScrapeError('');
    try {
      const res = await fetch('/api/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl.trim() }),
      });
      const data = await res.json();
      const prod = data.product || data.metadata;
      if (res.ok && data.success && prod) {
        if (prod.title) setTitle(prod.title);
        if (prod.description) setDescription(prod.description);
        if (prod.price) setPrice(String(prod.price).replace(/[^0-9.]/g, ''));
        if (prod.currency) setCurrency(prod.currency);
        if (prod.imageUrl || prod.image) setImage(prod.imageUrl || prod.image);
      } else {
        setScrapeError(data.error || 'Could not auto-fetch metadata. You can fill details manually.');
      }
    } catch (err) {
      setScrapeError('Network error while scraping link. Fill details manually.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !productUrl.trim()) return;

    const newProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      price: price ? String(price) : '0',
      currency: currency || 'USD',
      url: productUrl.trim(),
      image: image.trim(),
      description: description.trim(),
      collection: collection.trim() || 'All Products',
      active: true,
      inStock: true,
      createdAt: new Date().toISOString(),
    };

    onAddProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] dark-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Add a Product</h3>
              <p className="text-xs text-stone-400">
                Sell physical items, digital downloads, or affiliate merchandise
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 dark-scrollbar flex-1">
          {/* Omni URL scraper bar */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
              Paste Store / Product URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="Search for products or paste a link (e.g. Amazon, Shopify, Etsy)"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  required
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
                />
                {productUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductUrl('');
                      setScrapeError('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white transition p-0.5"
                    title="Clear link"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleScrape}
                disabled={isScraping || !productUrl.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Fill
                  </>
                )}
              </button>
            </div>
            {scrapeError && (
              <p className="text-[11px] text-amber-400 mt-1">{scrapeError}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Vintage Leather Jacket, E-Book Guide, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">
                Price
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="29.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          {/* Image URL & Preview */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">
              Product Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.example.com/item.jpg"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500"
              />
              {image && (
                <img
                  src={image}
                  alt="Product preview"
                  className="w-9 h-9 object-cover rounded-lg border border-stone-700"
                />
              )}
            </div>
          </div>

          {/* Collection */}
          {collections.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">
                Add to Collection
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">None (General)</option>
                {collections.map((col, idx) => (
                  <option key={idx} value={typeof col === 'string' ? col : col.title}>
                    {typeof col === 'string' ? col : col.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">
              Short Description (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Highlight key features or discounts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-emerald-900/20"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
