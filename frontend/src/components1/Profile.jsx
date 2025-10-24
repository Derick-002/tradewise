import React, { useEffect, useMemo, useState } from 'react';
import { MdEdit, MdClose, MdCheck, MdShield, MdEmail, MdBusiness } from 'react-icons/md';
import { useSelector } from 'react-redux';
import backendApi from '../utils/axiosInstance';
import { handleError } from '../utils/handleError';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserProfile() {
      try {
        setLoading(true);
        const res = await backendApi.get('/auth/settings');
        setProfileData(res.data);
      } catch (error) {
        const refinedError =handleError(error);
        console.log(refinedError, error);
        toast.error(refinedError.message);
      } finally {
        setLoading(false);
      }
    }
    getUserProfile();
  }, [user])

  const [activeTab, setActiveTab] = useState('basic');
  const [editing, setEditing] = useState(false);
  const [originalData, setOriginalData] = useState({}); // Track original values for comparison
  const [formData, setFormData] = useState({
    // All fields from backend onboardingSchema
    enterpriseDescription: '',
    name: '',
    currency: '',
    businessType: '',
    industry: '',
    foundedYear: '',
    description: '',
    website: '',
    address: '',
    businessHours: '',
    phoneNumber: '',
    anualRevenue: '',
    numberOfEmployees: '',
    paymentMethod: '',
    targetMarket: '',
    competitors: '',
    goals: '',
    sendMessage: ''
  });

  // Check if formData differs from originalData (with proper normalization for number fields)
  const hasChangesMemo = useMemo(() => {
    if (!originalData || Object.keys(originalData).length === 0) return false;

    return Object.keys(formData).some(key => {
      let currentValue = formData[key];
      let originalValue = originalData[key];

      // Normalize number fields for comparison
      if (key === 'foundedYear' || key === 'anualRevenue' || key === 'numberOfEmployees') {
        // Convert both to numbers for comparison (empty string becomes 0)
        const currentNum = currentValue === '' ? 0 : Number(currentValue);
        const originalNum = originalValue === '' ? 0 : Number(originalValue);
        return currentNum !== originalNum;
      }

      // For other fields, compare as strings
      return currentValue !== originalValue;
    });
  }, [formData, originalData]);

  // Update formData when profileData is loaded
  useEffect(() => {
    if (profileData) {
      const mappedData = {
        // Map all backend onboardingSchema fields to formData
        enterpriseDescription: profileData.enterpriseDescription || '',
        name: profileData.name || '',
        currency: profileData.currency || '',
        businessType: profileData.businessType || '',
        industry: profileData.industry || '',
        foundedYear: profileData.foundedYear || '', // API should return number, but form needs string
        description: profileData.description || '',
        website: profileData.website || '',
        address: profileData.address || '',
        businessHours: profileData.businessHours || '',
        phoneNumber: profileData.phoneNumber || '',
        anualRevenue: profileData.anualRevenue || '', // API should return number, but form needs string
        numberOfEmployees: profileData.numberOfEmployees || '', // API should return number, but form needs string
        paymentMethod: profileData.paymentMethod || '',
        targetMarket: profileData.targetMarket || '',
        competitors: profileData.competitors || '',
        goals: profileData.goals || '',
        sendMessage: profileData.sendMessage || ''
      };

      setFormData(mappedData);
      setOriginalData(mappedData); // Store original values for comparison
      // hasChangesMemo will automatically update to false since formData now matches originalData
    }
  }, [profileData]);

  const getModifiedFields = () => {
    const modified = {};

    // Compare formData with originalData and include changed fields
    Object.keys(formData).forEach(key => {
      const currentValue = formData[key];
      const originalValue = originalData[key];

      // Check if field has changed (including clearing fields)
      if (currentValue !== originalValue) {
        if (key === 'foundedYear' || key === 'anualRevenue' || key === 'numberOfEmployees') {
          // Convert number fields to numbers for API
          modified[key] = currentValue === '' ? undefined : Number(currentValue);
        } else {
          // Send empty strings for cleared optional fields
          modified[key] = currentValue;
        }
      }
    });

    return modified;
  };

  const completeness = useMemo(() => {
    if (loading || !profileData) return 0;

    const total = Object.keys(formData).length;
    const filled = Object.values(formData).filter(value =>
      value !== '' && value !== null && value !== undefined
    ).length;
    return Math.min(100, Math.round((filled / total) * 100));
  }, [formData, profileData, loading]);

  const initials = useMemo(() => {
    const name = profileData?.name || formData.name || 'User';
    const parts = name.trim().split(' ');
    const first = parts[0]?.[0] || 'U';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
  }, [profileData?.name, formData.name]);

  const onSave = async () => {
    try {
      // Only send modified fields to backend (including cleared fields)
      const modifiedData = getModifiedFields();

      // Always send the update, even if no fields changed (for consistency)
      const res = await backendApi.post('/auth/onboarding', modifiedData);

      // Update local profile data with only the changed fields
      if (profileData) {
        setProfileData(prev => ({
          ...prev,
          ...modifiedData
        }));
      }

      // Update originalData to reflect the new state
      setOriginalData(prev => ({
        ...prev,
        ...modifiedData
      }));

      setEditing(false);
      // hasChangesMemo will automatically update to false since formData now matches originalData
      console.log('Profile saved successfully:', modifiedData);
      toast.success('Profile saved successfully!');
    } catch (error) {
      const refinedError = handleError(error);
      console.error(refinedError, error);
      toast.error(refinedError.message);
    }
  };

  const onCancel = () => {
    // Reset form to original values (before any edits)
    setFormData(originalData);
    setEditing(false);
    // hasChangesMemo will automatically update to false since formData now matches originalData
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Handle number fields with proper validation
    if (type === 'number') {
      // Allow empty values or valid numbers
      if (value === '' || !isNaN(value)) {
        const numValue = value === '' ? '' : Number(value);
        if (numValue >= 0) { // Prevent negative numbers
          setFormData(prev => ({ ...prev, [name]: value })); // Keep as string for form
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Change detection is now handled by useMemo (hasChangesMemo)
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-500 to-amber-500 text-white px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="opacity-90">Manage your account details</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold border border-white/30">
              {initials}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Badge icon={<MdBusiness className="text-[#BE741E]"/>} label="Company" value={profileData?.name || formData.name || '—'} />
            <Badge icon={<MdEmail className="text-[#BE741E]"/>} label="Currency" value={profileData?.currency || formData.currency || '—'} />
            <Badge icon={<MdShield className="text-[#BE741E]"/>} label="Industry" value={profileData?.industry || formData.industry || '—'} />
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Profile completeness</p>
              <p className="text-sm font-medium text-gray-900">
                {loading ? 'Loading...' : `${completeness}%`}
              </p>
            </div>
            {!loading && (
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#BE741E] rounded-full transition-all" style={{ width: `${completeness}%` }}></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab==='basic'} onClick={()=>setActiveTab('basic')}>Basic Info</TabButton>
        <TabButton active={activeTab==='description'} onClick={()=>setActiveTab('description')}>Description</TabButton>
        <TabButton active={activeTab==='contacts'} onClick={()=>setActiveTab('contacts')}>Contacts</TabButton>
        <TabButton active={activeTab==='scale'} onClick={()=>setActiveTab('scale')}>Scale & Operations</TabButton>
        <TabButton active={activeTab==='payments'} onClick={()=>setActiveTab('payments')}>Payments</TabButton>
        <TabButton active={activeTab==='strategy'} onClick={()=>setActiveTab('strategy')}>Strategy</TabButton>
        <TabButton active={activeTab==='security'} onClick={()=>setActiveTab('security')}>Security</TabButton>
        <TabButton active={activeTab==='preferences'} onClick={()=>setActiveTab('preferences')}>Preferences</TabButton>
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* Header with Edit/Save buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500">Tell us about your business.</p>
            </div>
            {!editing ? (
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={loading ? undefined : ()=>setEditing(true)}
                disabled={loading}
              >
                <MdEdit/>{loading ? 'Loading...' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    hasChangesMemo
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={hasChangesMemo ? onSave : undefined}
                  disabled={!hasChangesMemo}
                >
                  <MdCheck/> Save
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onCancel}>
                  <MdClose/> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Basic Information Section */}
          <Section title="Basic Information" subtitle="Tell us about your business.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Company Name *" name="name" value={formData.name} onChange={handleChange} required disabled={!editing} />
              <InputField label="Enterprise Description" name="enterpriseDescription" value={formData.enterpriseDescription} onChange={handleChange} placeholder="Brief description of your enterprise" disabled={!editing} />
              <SelectField label="Business Type" name="businessType" value={formData.businessType} onChange={handleChange} options={['Sole Proprietorship','Partnership','Corporation','LLC','Franchise','Other']} disabled={!editing} />
              <InputField label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="Technology, Retail, Manufacturing" disabled={!editing} />
              <InputField label="Founded Year" name="foundedYear" value={formData.foundedYear} onChange={handleChange} type="number" placeholder="e.g., 2020" min="1900" max={new Date().getFullYear()} disabled={!editing} />
              <SelectField label="Currency" name="currency" value={formData.currency} onChange={handleChange} options={['USD', 'EUR', 'GBP', 'RWF', 'KES', 'UGX', 'TZS']} disabled={!editing} />
            </div>
          </Section>
        </div>
      )}

      {/* Description Tab */}
      {activeTab === 'description' && (
        <div className="space-y-6">
          {/* Header with Edit/Save buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Description</h2>
              <p className="text-sm text-gray-500">What do you do?</p>
            </div>
            {!editing ? (
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={loading ? undefined : ()=>setEditing(true)}
                disabled={loading}
              >
                <MdEdit/>{loading ? 'Loading...' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    hasChangesMemo
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={hasChangesMemo ? onSave : undefined}
                  disabled={!hasChangesMemo}
                >
                  <MdCheck/> Save
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onCancel}>
                  <MdClose/> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Description Section */}
          <Section title="Description" subtitle="What do you do?">
            <TextAreaField label="Business Description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your business, products, and services..." disabled={!editing} />
          </Section>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          {/* Header with Edit/Save buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-500">How can customers reach you?</p>
            </div>
            {!editing ? (
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={loading ? undefined : ()=>setEditing(true)}
                disabled={loading}
              >
                <MdEdit/>{loading ? 'Loading...' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    hasChangesMemo
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={hasChangesMemo ? onSave : undefined}
                  disabled={!hasChangesMemo}
                >
                  <MdCheck/> Save
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onCancel}>
                  <MdClose/> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Contact Information Section */}
          <Section title="Contact Information" subtitle="How can customers reach you?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextAreaField label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Business address" rows={2} disabled={!editing} />
              <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Business phone number" disabled={!editing} />
              <InputField label="Website" name="website" value={formData.website} onChange={handleChange} type="url" placeholder="https://yourwebsite.com" disabled={!editing} />
              <InputField label="Business Hours" name="businessHours" value={formData.businessHours} onChange={handleChange} placeholder="Monday-Friday 9AM-6PM" disabled={!editing} />
            </div>
          </Section>
        </div>
      )}

      {/* Scale & Operations Tab */}
      {activeTab === 'scale' && (
        <div className="space-y-6">
          {/* Header with Edit/Save buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Scale & Operations</h2>
              <p className="text-sm text-gray-500">A quick sense of size.</p>
            </div>
            {!editing ? (
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={loading ? undefined : ()=>setEditing(true)}
                disabled={loading}
              >
                <MdEdit/>{loading ? 'Loading...' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    hasChangesMemo
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={hasChangesMemo ? onSave : undefined}
                  disabled={!hasChangesMemo}
                >
                  <MdCheck/> Save
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onCancel}>
                  <MdClose/> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Scale & Operations Section */}
          <Section title="Scale & Operations" subtitle="A quick sense of size.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Annual Revenue" name="anualRevenue" value={formData.anualRevenue} onChange={handleChange} type="number" placeholder="Annual revenue amount" disabled={!editing} />
              <InputField label="Number of Employees" name="numberOfEmployees" value={formData.numberOfEmployees} onChange={handleChange} type="number" placeholder="Number of employees" disabled={!editing} />
            </div>
          </Section>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Header with Edit/Save buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
              <p className="text-sm text-gray-500">What do you accept?</p>
            </div>
            {!editing ? (
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={loading ? undefined : ()=>setEditing(true)}
                disabled={loading}
              >
                <MdEdit/>{loading ? 'Loading...' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    hasChangesMemo
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={hasChangesMemo ? onSave : undefined}
                  disabled={!hasChangesMemo}
                >
                  <MdCheck/> Save
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onCancel}>
                  <MdClose/> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Payments Section */}
          <Section title="Payments" subtitle="What do you accept?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SelectField label="Payment Method" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} options={['Cash', 'Credit_Card', 'Debit_Card', 'Bank_Transfer', 'Mobile_Money', 'PayPal', 'Check', 'Crypto']} disabled={!editing} />
            </div>
          </Section>
        </div>
      )}

      {/* Strategy Tab */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          {/* Header with Edit/Save buttons */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Strategy</h2>
              <p className="text-sm text-gray-500">Who, and how will you serve them?</p>
            </div>
            {!editing ? (
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                  loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={loading ? undefined : ()=>setEditing(true)}
                disabled={loading}
              >
                <MdEdit/>{loading ? 'Loading...' : 'Edit'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    hasChangesMemo
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={hasChangesMemo ? onSave : undefined}
                  disabled={!hasChangesMemo}
                >
                  <MdCheck/> Save
                </button>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={onCancel}>
                  <MdClose/> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Strategy Section */}
          <Section title="Strategy" subtitle="Who, and how will you serve them?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextAreaField label="Target Market" name="targetMarket" value={formData.targetMarket} onChange={handleChange} placeholder="Describe your target market..." rows={2} disabled={!editing} />
              <TextAreaField label="Competitors" name="competitors" value={formData.competitors} onChange={handleChange} placeholder="List your main competitors..." rows={2} disabled={!editing} />
            </div>
            <TextAreaField label="Goals" name="goals" value={formData.goals} onChange={handleChange} placeholder="Short-term and long-term goals..." rows={3} disabled={!editing} />
            <TextAreaField label="Message" name="sendMessage" value={formData.sendMessage} onChange={handleChange} placeholder="Any additional message..." rows={2} disabled={!editing} />
          </Section>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-500">Manage your security settings.</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">UI only</span>
          </div>

          {/* Security Section */}
          <Section title="Security Settings" subtitle="Account security and authentication.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 bg-white/80">
                <span className="text-gray-800 text-sm">Two-Factor Authentication</span>
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Disabled</span>
              </div>
              <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 bg-white/80">
                <span className="text-gray-800 text-sm">Password</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Last updated —</span>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              <p className="text-sm text-gray-500">Customize your experience.</p>
            </div>
          </div>

          {/* Preferences Section */}
          <Section title="Notification Preferences" subtitle="Choose what you want to be notified about.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 bg-white/80 cursor-pointer">
                <span className="text-gray-800 text-sm">Email notifications</span>
                <input type="checkbox" defaultChecked className="accent-[#BE741E] w-4 h-4" />
              </label>
              <label className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 bg-white/80 cursor-pointer">
                <span className="text-gray-800 text-sm">Weekly summary</span>
                <input type="checkbox" className="accent-[#BE741E] w-4 h-4" />
              </label>
              <label className="flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 bg-white/80 cursor-pointer">
                <span className="text-gray-800 text-sm">Product updates</span>
                <input type="checkbox" className="accent-[#BE741E] w-4 h-4" />
              </label>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

// ...
const Section = ({ title, subtitle, children }) => (
  <div className="bg-white/70 rounded-2xl p-5 border border-gray-200">
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm border transition ${active ? 'bg-[#BE741E] text-white border-[#BE741E]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
    {children}
  </button>
);

// Input Component
const InputField = ({ label, type = 'text', name, value, onChange, placeholder, required, min, max, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
      min={min} max={max} disabled={disabled}
      className={`mt-1 block w-full border border-gray-200 rounded-xl px-3 py-2 transition-all bg-white/80 ${
        disabled
          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
          : 'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent'
      }`}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      name={name} value={value} onChange={onChange} disabled={disabled}
      className={`mt-1 block w-full border border-gray-200 rounded-xl px-3 py-2 transition-all bg-white/80 ${
        disabled
          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
          : 'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent'
      }`}
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const Badge = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 bg-white/80 border border-gray-100 rounded-xl p-3">
    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder, rows = 3, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} disabled={disabled}
      className={`mt-1 block w-full border border-gray-200 rounded-xl px-3 py-2 transition-all bg-white/80 ${
        disabled
          ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
          : 'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent'
      }`}
    />
  </div>
);

export default Profile;
