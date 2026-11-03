'use client';

import React, { useState } from 'react';
import { X, Loader2 } from '@/components/icons';
import Modal, { ModalButton, Field, inputClass } from '@/components/ui/Modal';

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
    <Modal
      onClose={onClose}
      title="Add Product"
      width="sm"
      footer={
        <>
          <ModalButton variant="secondary" className="w-[50%]" onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton type="submit" form="add-product-form" variant="primary" className="w-[50%]">
            Save Product
          </ModalButton>
        </>
      }
    >
      <form id="add-product-form" onSubmit={handleSubmit} className="flex flex-col gap-[15px]">
        <div className="flex flex-col gap-[5px]">
          <span className="text-[14px] font-medium text-black">Product URL *</span>
          <div className="flex gap-[10px]">
            <div className="relative flex-1">
              <input
                type="url"
                placeholder="Paste an Amazon, Shopify or Etsy link"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                required
                aria-label="Product URL"
                className={`${inputClass} pr-[30px]`}
              />
              {productUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setProductUrl('');
                    setScrapeError('');
                  }}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#808080] hover:text-[#404040]"
                  title="Clear link"
                  aria-label="Clear link"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <ModalButton
              variant="secondary"
              className="w-auto shrink-0 gap-[6px] px-[12px]"
              onClick={handleScrape}
              disabled={isScraping || !productUrl.trim()}
            >
              {isScraping ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Fetching...
                </>
              ) : (
                'Auto-Fill'
              )}
            </ModalButton>
          </div>
          {scrapeError && <span className="text-[10px] text-[#92400E]">{scrapeError}</span>}
        </div>

        <Field label="Title *">
          <input
            type="text"
            placeholder="e.g. Leather Jacket"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-[10px]">
          <Field label="Price">
            <input
              type="text"
              placeholder="29.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </Field>
        </div>

        <div className="flex flex-col gap-[5px]">
          <span className="text-[14px] font-medium text-black">Image URL</span>
          <div className="flex items-center gap-[10px]">
            <input
              type="url"
              placeholder="https://images.example.com/item.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              aria-label="Image URL"
              className={inputClass}
            />
            {image && (
              <img
                src={image}
                alt="Product preview"
                className="size-[34px] shrink-0 rounded-[5px] border-[0.5px] border-[#DCDCDC] object-cover"
              />
            )}
          </div>
        </div>

        {collections.length > 0 && (
          <Field label="Collection">
            <select value={collection} onChange={(e) => setCollection(e.target.value)} className={inputClass}>
              <option value="">None (General)</option>
              {collections.map((col, idx) => (
                <option key={idx} value={typeof col === 'string' ? col : col.title}>
                  {typeof col === 'string' ? col : col.title}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Description">
          <textarea
            rows={2}
            placeholder="Optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </form>
    </Modal>
  );
}
