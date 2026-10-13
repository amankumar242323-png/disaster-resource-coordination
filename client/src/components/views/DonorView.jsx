import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  IconHeart,
  IconCreditCard,
  IconCheckCircle2,
  IconPackage,
  IconDownload,
  IconDroplet
} from '../Icons';

export const DonorView = () => {
  const { shelters, donations, recordDonation, addToast } = useApp();

  const [donationType, setDonationType] = useState('funds'); // 'funds' | 'supplies'
  const [selectedAmount, setSelectedAmount] = useState('5000');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [selectedFund, setSelectedFund] = useState('Emergency Flood & Cyclone Relief Fund');

  // Supply Pledge State
  const [supplyPledge, setSupplyPledge] = useState({
    item: 'Drinking Water (20L Cans)',
    quantity: 100,
    targetShelterId: shelters[0]?.id || '',
    deliveryDate: 'Tomorrow Morning'
  });

  // Razorpay Checkout Modal Simulation State
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Extract all critical supplies across shelters
  const criticalSupplies = [];
  shelters.forEach((shelter) => {
    shelter.inventory.forEach((item) => {
      if (item.status === 'Critical' || item.status === 'Low') {
        criticalSupplies.push({
          shelterName: shelter.name,
          shelterId: shelter.id,
          itemName: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          status: item.status
        });
      }
    });
  });

  const handleInitiateMonetaryDonation = (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? customAmount : selectedAmount;
    if (!finalAmount || Number(finalAmount) <= 0) {
      addToast('Please enter a valid donation amount.', 'warning');
      return;
    }
    setShowRazorpayModal(true);
  };

  const handleRazorpaySuccess = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowRazorpayModal(false);

      const finalAmount = customAmount ? customAmount : selectedAmount;
      const txId = `pay_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`;

      const donationRecord = {
        donorName: donorName || 'Anonymous Citizen',
        type: 'Funds',
        amount: `₹ ${Number(finalAmount).toLocaleString('en-IN')}`,
        transactionId: txId,
        paymentGateway: 'Razorpay (Verified Gateway)',
        destination: selectedFund
      };

      recordDonation(donationRecord);
      setActiveReceipt(donationRecord);
    }, 1200);
  };

  const handleSupplyPledgeSubmit = (e) => {
    e.preventDefault();
    const shelter = shelters.find((s) => s.id === supplyPledge.targetShelterId);
    const donationRecord = {
      donorName: donorName || 'Civic Relief Donor',
      type: 'Supplies',
      items: `${supplyPledge.quantity}x ${supplyPledge.item}`,
      destination: shelter ? shelter.name : 'Central Depot',
      notes: `Expected: ${supplyPledge.deliveryDate}`
    };

    recordDonation(donationRecord);
    setSupplyPledge({
      item: 'Drinking Water (20L Cans)',
      quantity: 100,
      targetShelterId: shelters[0]?.id || '',
      deliveryDate: 'Tomorrow Morning'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Donor Hero */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-success">Direct Aid Gateway</span>
            <span className="badge badge-info">100% Tax Deductible (80G)</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', margin: '0 0 0.5rem 0' }}>Support Disaster Relief Operations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Every rupee and ration packet directly restocks shelters in the flood-affected zone. Transparent tracking with instant receipts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            className={`btn ${donationType === 'funds' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDonationType('funds')}
          >
            <IconCreditCard size={16} /> Donate Funds
          </button>
          <button
            type="button"
            className={`btn ${donationType === 'supplies' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDonationType('supplies')}
          >
            <IconPackage size={16} /> Pledge Supplies
          </button>
        </div>
      </div>

      {/* Main Donation Container */}
      {donationType === 'funds' ? (
        <div className="grid-2">
          {/* Donation Form */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <IconCreditCard size={22} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ margin: 0 }}>Emergency Financial Relief Contribution</h3>
            </div>

            <form onSubmit={handleInitiateMonetaryDonation}>
              <div className="form-group">
                <label className="form-label">Select Amount (INR)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {['1000', '2500', '5000', '10000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`btn ${selectedAmount === amt && !customAmount ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      style={{ padding: '0.65rem 0.25rem' }}
                    >
                      ₹ {Number(amt).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom amount in ₹"
                  className="form-control"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount('');
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Donor Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aditi Sharma (or leave blank for Anonymous)"
                  className="form-control"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email for Tax Exemption Receipt (80G)</label>
                <input
                  type="email"
                  placeholder="aditi@example.com"
                  className="form-control"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Relief Fund</label>
                <select
                  className="form-control"
                  value={selectedFund}
                  onChange={(e) => setSelectedFund(e.target.value)}
                >
                  <option value="Emergency Flood & Cyclone Relief Fund">Emergency Flood & Cyclone Relief Fund</option>
                  <option value="Medical & Trauma Care Pool">Medical & Trauma Care Pool</option>
                  <option value="Shelter Bedding & Winter Supplies">Shelter Bedding & Winter Supplies</option>
                  <option value="Children & Infant Nutrition Fund">Children & Infant Nutrition Fund</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <IconHeart size={18} /> Proceed to Secure Razorpay Gateway
              </button>
            </form>
          </div>

          {/* Impact Breakdown Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Where Your Money Goes</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <IconDroplet size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹ 1,000 = 50 Liters Clean Water</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Provides drinking water for 10 stranded families</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <IconPackage size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹ 2,500 = 10 Emergency Food Rations</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Ready-to-eat calorie-dense meals for evacuees</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-emergency)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <IconHeart size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹ 10,000 = 1 Trauma & Medical Resupply</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Antibiotics, bandages, IV fluids, and insulin cold-chain</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Receipt Card if available */}
            {activeReceipt && (
              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-success)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-success">Verified Transaction</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{activeReceipt.transactionId}</span>
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0' }}>Official Donation Receipt</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
                  Donor: {activeReceipt.donorName} • Amount: <strong>{activeReceipt.amount}</strong>
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.print()}
                >
                  <IconDownload size={14} /> Download 80G Tax Exemption Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Supply Pledge Form */
        <div className="glass-panel" style={{ padding: '1.75rem', maxWidth: '750px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <IconPackage size={22} style={{ color: 'var(--color-warning)' }} />
            <h3 style={{ margin: 0 }}>Pledge Essential Supplies & Physical Aid</h3>
          </div>

          <form onSubmit={handleSupplyPledgeSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Supply Category / Item *</label>
                <select
                  className="form-control"
                  value={supplyPledge.item}
                  onChange={(e) => setSupplyPledge({ ...supplyPledge, item: e.target.value })}
                >
                  <option value="Drinking Water (20L Cans)">Drinking Water (20L Cans)</option>
                  <option value="Dry Food Rations (Rice/Pulses)">Dry Food Rations (Rice/Pulses)</option>
                  <option value="Water Purification Tablets">Water Purification Tablets</option>
                  <option value="Thermal Blankets & Cots">Thermal Blankets & Cots</option>
                  <option value="Trauma & First Aid Kits">Trauma & First Aid Kits</option>
                  <option value="Infant Baby Formula & Diapers">Infant Baby Formula & Diapers</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity Pledged *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-control"
                  value={supplyPledge.quantity}
                  onChange={(e) => setSupplyPledge({ ...supplyPledge, quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Destination Shelter *</label>
                <select
                  className="form-control"
                  value={supplyPledge.targetShelterId}
                  onChange={(e) => setSupplyPledge({ ...supplyPledge, targetShelterId: e.target.value })}
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.district})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Delivery Window</label>
                <input
                  type="text"
                  placeholder="e.g. Today by 4 PM / Tomorrow morning"
                  className="form-control"
                  value={supplyPledge.deliveryDate}
                  onChange={(e) => setSupplyPledge({ ...supplyPledge, deliveryDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary">
                <IconCheckCircle2 size={16} /> Confirm Supply Pledge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Critical Supplies Wishlist Across Shelters */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Current Critical Shelter Shortages</h3>
        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Direct supply requirements reported by relief workers in the last 4 hours
        </p>

        <div className="grid-3">
          {criticalSupplies.map((item, idx) => (
            <div key={idx} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              borderLeft: item.status === 'Critical' ? '4px solid var(--color-emergency)' : '4px solid var(--color-warning)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{item.category}</span>
                <span className={`badge ${item.status === 'Critical' ? 'badge-emergency' : 'badge-warning'}`}>
                  {item.status}
                </span>
              </div>
              <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>{item.itemName}</h5>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {item.shelterName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                Stock remaining: {item.quantity} {item.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Donations Transparency Feed */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Community Donations & Aid Ledger</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {donations.map((don) => (
            <div key={don.id} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {don.donorName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Contribution: <strong>{don.amount || don.items}</strong> • Target: {don.destination}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  {don.status}
                </span>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  {don.date} {don.transactionId && `• ${don.transactionId}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Razorpay Simulation Modal */}
      {showRazorpayModal && (
        <div className="modal-overlay" onClick={() => setShowRazorpayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', background: '#09101d', border: '1px solid #1e3a8a' }}>
            <div style={{ background: '#0284c7', margin: '-1.75rem -1.75rem 1.25rem -1.75rem', padding: '1.25rem 1.75rem', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', color: '#ffffff' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>DRC DISASTER RELIEF FOUNDATION</div>
              <h3 style={{ margin: '0.25rem 0', color: '#ffffff' }}>
                ₹ {Number(customAmount || selectedAmount).toLocaleString('en-IN')}
              </h3>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Powered by Razorpay (Test Mode Integration)</div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Simulating standard Razorpay checkout flow as specified in system brief.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>UPI (Google Pay, PhonePe, Paytm)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Instant bank-to-bank disaster relief</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-success)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cards (Visa, Mastercard, RuPay)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Credit & Debit Cards</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowRazorpayModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={isProcessingPayment}
                onClick={handleRazorpaySuccess}
              >
                {isProcessingPayment ? 'Authorizing...' : 'Authorize & Pay ₹ ' + (customAmount || selectedAmount)}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
