import React, { useEffect, useState, useRef } from 'react';
import { Save, Upload, User } from 'lucide-react';
import { getPrograms } from '../../../api/programs';
import { getDepartments } from '../../../api/departments';
import { createStudent } from '../../../api/students';
import { getBranches } from '../../../api/branches';
import { getTuitionPlans } from '../../../api/tuition';
import { getPaymentPlans } from '../../../api/paymentPlans.ts';
import fetchClient from '../../../lib/fetchClient';
import { Program, Department } from '../../../types/school';
import { Branch } from '../../../types/school';
import { useBranch } from '../../../context/BranchContext';

export const StudentRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalIdName: '',
    gender: '',
    placeOfBirth: '',
    dateOfBirth: '',
    motherName: '',
    fatherName: '',
    address: '',
    phoneNumber: '',
    email: '',
    specialtyId: '',
    session: '',
  regionOfOrigin: '',
  academicYear: '',
    level: 1,
    profilePicture: '',
    guardianName: '',
    guardianAddress: '',
    guardianContact: ''
  ,branchId: ''
  });
  const [region, setRegion] = useState('');
  const [imageWarning, setImageWarning] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [phoneCountry, setPhoneCountry] = useState('CM');
  const [showCountryList, setShowCountryList] = useState(false);
  const countryListRef = useRef<HTMLDivElement | null>(null);
  const [guardianCountry, setGuardianCountry] = useState('CM');
  const [showGuardianList, setShowGuardianList] = useState(false);
  const guardianListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (countryListRef.current && !countryListRef.current.contains(e.target as Node)) setShowCountryList(false);
      if (guardianListRef.current && !guardianListRef.current.contains(e.target as Node)) setShowGuardianList(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShowCountryList(false); setShowGuardianList(false); } };
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onEsc);
  return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onEsc); };
  }, []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tuitionPlans, setTuitionPlans] = useState<Array<any>>([]);
  const [paymentPlans, setPaymentPlans] = useState<Array<any>>([]);
  const [selectedPaymentPlans, setSelectedPaymentPlans] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const { currentBranch } = useBranch();

  // auto-close modal after 2s
  useEffect(() => {
    if (!showSuccessModal) return;
    const t = setTimeout(() => setShowSuccessModal(false), 2000);
    return () => clearTimeout(t);
  }, [showSuccessModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    // restore draft if present
    try {
      const raw = localStorage.getItem('studentFormDraft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // shallow merge with defaults - only known keys will be kept
          setFormData(prev => ({ ...prev, ...parsed.formData } as any));
          if (parsed.thumbnail) setThumbnail(parsed.thumbnail as string);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    getPrograms().then(setPrograms).catch(() => {});
    getDepartments().then(setDepartments).catch(() => {});
    fetchClient.get('/api/specialties').then(res => res.json()).then(setSpecialties).catch(() => {});
    getBranches().then(setBranches).catch(() => {});
  getTuitionPlans().then(setTuitionPlans).catch(() => {});
  getPaymentPlans().then(setPaymentPlans).catch(() => {});
    // prefill branch from context only when no draft provided
    if (!localStorage.getItem('studentFormDraft') && currentBranch) {
      setFormData(prev => ({ ...prev, branchId: (currentBranch as any)._id || (currentBranch as any).id || '' }));
    }
  }, []);

  // persist draft whenever formData or thumbnail changes
  useEffect(() => {
    try {
      const payload = { formData, thumbnail };
      localStorage.setItem('studentFormDraft', JSON.stringify(payload));
    } catch (e) {
      // ignore storage errors
    }
  }, [formData, thumbnail]);

  const countryDefs: Record<string, { code: string; digitsPrefix: string; regex: RegExp; placeholder: string; label: string }> = {
    // Cameroon numbers: +237 followed by 9 digits (local format e.g. 6XX XXX XXX)
    CM: { code: '+237', digitsPrefix: '237', regex: /^237[23679]\d{8}$/, placeholder: '6XX XXX XXX', label: 'Cameroon' },
    NG: { code: '+234', digitsPrefix: '234', regex: /^234[789]\d{8}$/, placeholder: '80X XXX XXXX', label: 'Nigeria' },
  GH: { code: '+233', digitsPrefix: '233', regex: /^233[24]\d{7}$/, placeholder: '24X XXX XXX', label: 'Ghana' },

  };

    // Render SVG flag icons so flags show consistently across platforms (Windows often lacks emoji flags)
    const getFlagIcon = (code: string) => {
      switch (code) {
        case 'CM':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="0" y="0" width="10" height="20" fill="#007A3D" />
              <rect x="10" y="0" width="10" height="20" fill="#CE1126" />
              <rect x="20" y="0" width="10" height="20" fill="#FCD116" />
              <polygon fill="#FCD116" points="15,6.5 15.88,8.79 18.33,8.92 16.43,10.46 17.06,12.83 15,11.5 12.94,12.83 13.57,10.46 11.67,8.92 14.12,8.79" />
            </svg>
          );
        case 'NG':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#008753" />
              <rect x="10" width="10" height="20" fill="#FFFFFF" />
              <rect x="20" width="10" height="20" fill="#008753" />
            </svg>
          );
        case 'GH':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#E30B17" />
              <rect y="6.66" width="30" height="6.66" fill="#FCD116" />
              <rect y="13.33" width="30" height="6.66" fill="#006A4E" />
              <polygon points="15,6 17,11 12,8 18,8 13,11" fill="#000" transform="translate(0,0) scale(1)" />
            </svg>
          );
        case 'KE':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#006600" />
              <rect y="6.66" width="30" height="6.66" fill="#FFFFFF" />
              <rect y="13.33" width="30" height="6.66" fill="#FF0000" />
            </svg>
          );
        case 'ZA':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#002395" />
            </svg>
          );
        case 'UG':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#000000" />
              <rect y="6.66" width="30" height="6.66" fill="#FFFF00" />
              <rect y="13.33" width="30" height="6.66" fill="#FF0000" />
            </svg>
          );
        case 'TZ':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#007A3D" />
            </svg>
          );
        case 'SN':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#00853F" />
              <rect y="13.33" width="30" height="6.66" fill="#FDEF42" />
            </svg>
          );
        case 'MA':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#C1272D" />
            </svg>
          );
        case 'EG':
          return (
            <svg className="w-6 h-4" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="30" height="20" fill="#CE1126" />
            </svg>
          );
        default:
          return (
            <div className="w-6 h-4 bg-gray-200 rounded-sm" />
          );
      }
    };

  const validateAll = () => {
    const errs: Record<string, string> = {};
    if (!formData.firstName || !formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName || !formData.lastName.trim()) errs.lastName = 'Last name is required';
    if (!formData.nationalIdName || !formData.nationalIdName.trim()) errs.nationalIdName = 'Name on national ID is required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.placeOfBirth || !formData.placeOfBirth.trim()) errs.placeOfBirth = 'Place of birth is required';
    if (!formData.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    if (!formData.motherName || !formData.motherName.trim()) errs.motherName = "Mother's name is required";
    if (!formData.fatherName || !formData.fatherName.trim()) errs.fatherName = "Father's name is required";
    if (!formData.address || !formData.address.trim()) errs.address = 'Address is required';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'A valid email is required';
    if (!(formData as any).specialtyId) errs.specialtyId = 'Specialty is required';
  if (!formData.branchId) errs.branchId = 'Branch is required';
    if (!formData.session) errs.session = 'Session is required';
  if (!formData.academicYear) errs.academicYear = 'Academic year is required';
    if (!formData.level || Number(formData.level) < 1) errs.level = 'Level is required';
    if (!formData.guardianName || !formData.guardianName.trim()) errs.guardianName = 'Guardian name is required';
    if (!formData.guardianContact || !formData.guardianContact.trim()) errs.guardianContact = 'Guardian contact is required';
    else {
      // validate guardian contact using selected guardian country
      const defG = countryDefs[guardianCountry] || countryDefs['CM'];
      let cleanedG = (formData.guardianContact || '').replace(/\D+/g, '');
      // if user already entered the country prefix, don't double-prefix
      if (cleanedG.startsWith(defG.digitsPrefix)) {
        // ok
      } else {
        cleanedG = `${defG.digitsPrefix}${cleanedG}`;
      }
      if (!defG.regex.test(cleanedG)) errs.guardianContact = `Guardian contact must be valid for ${defG.label}`;
    }
    if (!formData.guardianAddress || !formData.guardianAddress.trim()) errs.guardianAddress = 'Guardian address is required';

    // phone validation using selected country
    const def = countryDefs[phoneCountry] || countryDefs['CM'];
    let cleaned = (formData.phoneNumber || '').replace(/\D+/g, '');
    if (cleaned.startsWith(def.digitsPrefix)) {
      // already has country prefix
    } else {
      cleaned = `${def.digitsPrefix}${cleaned}`;
    }
    if (!def.regex.test(cleaned)) errs.phoneNumber = `Phone number must be valid for ${def.label} (local format: ${def.placeholder})`;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!validateAll()) { setSubmitting(false); return; }
    // map to backend shape
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      placeOfBirth: formData.placeOfBirth,
      // prefer explicit value from formData, fallback to local region state
      regionOfOrigin: (formData as any).regionOfOrigin || region || '',
      // branch expected as 'branch' by backend
      branch: formData.branchId,
      phoneNumber: formData.phoneNumber,
      gender: (formData.gender as 'Male' | 'Female'),
      email: formData.email,
      specialty: (formData as any).specialtyId,
      profilePicture: formData.profilePicture,
      // include academicYear; fallback to current batch range if not provided
      academicYear: (formData as any).academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  // include tuitionPlan id if selected
  tuitionPlan: (formData as any).tuitionPlanId || undefined,
      // include any selected payment plan ids
      paymentPlans: selectedPaymentPlans.length ? selectedPaymentPlans : undefined,
      guardian: {
        name: formData.guardianName,
        address: formData.guardianAddress,
        contact: formData.guardianContact
      }
    };
    (async () => {
  try {
          if (selectedFile) {
          setUploading(true);
          const form = new FormData();
          form.append('file', selectedFile);
          // attach Authorization header if token present
          const token = fetchClient.getAuthToken ? fetchClient.getAuthToken() : null;
          const resp = await fetch('/api/uploads/profile', { method: 'POST', body: form, headers: token ? { Authorization: `Bearer ${token}` } : undefined });
          setUploading(false);
          if (!resp.ok) {
            // try to parse JSON error body, fall back to text
            let errMsg = `Upload failed with status ${resp.status}`;
            try {
              const errJson = await resp.json();
              errMsg = errJson.message || JSON.stringify(errJson);
            } catch (e) {
              const txt = await resp.text();
              errMsg = txt || errMsg;
            }
            throw new Error(errMsg);
          }
          let body: any = null;
          try {
            body = await resp.json();
          } catch (e) {
            // server returned non-JSON (e.g., HTML); surface a friendly message
            const txt = await resp.text();
            throw new Error(`Upload returned unexpected response: ${txt.slice(0, 200)}`);
          }
          // backend now returns { id, url } where id is GridFS id; prefer id-based fetch path so file is served from DB
          const returnedUrl = body?.url as string | undefined;
          const returnedId = body?.id as string | undefined;
          if (returnedId) {
            const devBackend = (import.meta as any)?.env?.DEV ? 'http://localhost:5000' : '';
            payload.profilePicture = `${devBackend || window.location.origin}/api/uploads/file/${returnedId}`;
          } else if (returnedUrl) {
            // fallback to returned url (may already be absolute)
            payload.profilePicture = returnedUrl.startsWith('/') ? `${window.location.origin}${returnedUrl}` : returnedUrl;
          }
        }

        // ensure phone number includes selected country code in international format
        const def2 = countryDefs[phoneCountry] || countryDefs['CM'];
        let cleanedPhone = (formData.phoneNumber || '').replace(/\D+/g, '');
        if (cleanedPhone.startsWith(def2.digitsPrefix)) {
          // already has numeric prefix
        } else {
          cleanedPhone = `${def2.digitsPrefix}${cleanedPhone}`;
        }
        payload.phoneNumber = `${def2.code}${cleanedPhone.slice(def2.digitsPrefix.length)}`; // ensure single +code prefix (e.g. +2376...)

        // ensure guardian contact uses guardian country selection and normalized format
        const defG2 = countryDefs[guardianCountry] || countryDefs['CM'];
        let cleanedG2 = (formData.guardianContact || '').replace(/\D+/g, '');
        if (cleanedG2.startsWith(defG2.digitsPrefix)) {
          // already has numeric prefix
        } else {
          cleanedG2 = `${defG2.digitsPrefix}${cleanedG2}`;
        }
        payload.guardian.contact = `${defG2.code}${cleanedG2.slice(defG2.digitsPrefix.length)}`;

  // debug: log final payload so we can inspect phone formats sent to server (snapshot)
  // (remove or disable in production)
  // eslint-disable-next-line no-console
  console.log('Submitting student payload:', JSON.stringify(payload));
  await createStudent(payload as any);
  // clear draft and reset form on success
  try { localStorage.removeItem('studentFormDraft'); } catch (e) { /* ignore */ }
  setFormData({
    firstName: '',
    lastName: '',
    nationalIdName: '',
    gender: '',
    placeOfBirth: '',
    dateOfBirth: '',
    motherName: '',
    fatherName: '',
    address: '',
    phoneNumber: '',
    email: '',
    specialtyId: '',
    session: '',
  regionOfOrigin: '',
  academicYear: '',
  level: 1,
  profilePicture: '',
    guardianName: '',
    guardianAddress: '',
    guardianContact: ''
  ,branchId: ''
  });
  setThumbnail(null);
  setSelectedFile(null);
  setErrors({});
  setSubmitting(false);
  setModalMessage('Student created successfully');
  setShowSuccessModal(true);
      } catch (err: any) {
        setSubmitting(false);
        setUploading(false);
        console.error(err);
        if (err && err.status === 409) {
          setModalMessage('A student with the same identity already exists.');
          // highlight the fields we used to detect duplicates
          setErrors(prev => ({
            ...prev,
            firstName: 'Possible duplicate',
            lastName: 'Possible duplicate',
            dateOfBirth: 'Possible duplicate',
            placeOfBirth: 'Possible duplicate'
          }));
        } else {
          const msg = err instanceof Error ? err.message : JSON.stringify(err);
          setModalMessage(`Failed to create student: ${msg}`);
        }
        setShowSuccessModal(true);
      }
    })();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Registration</h1>
        <p className="text-gray-600">Register a new student in the system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name as on National ID *</label>
              <input
                type="text"
                name="nationalIdName"
                value={formData.nationalIdName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.nationalIdName && <p className="text-sm text-red-600 mt-1">{errors.nationalIdName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className="text-sm text-red-600 mt-1">{errors.gender}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth *</label>
              <input
                type="text"
                name="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.placeOfBirth && <p className="text-sm text-red-600 mt-1">{errors.placeOfBirth}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1">{errors.dateOfBirth}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name *</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.motherName && <p className="text-sm text-red-600 mt-1">{errors.motherName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name *</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.fatherName && <p className="text-sm text-red-600 mt-1">{errors.fatherName}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
              <div className="flex">
                  {/* custom dropdown: closed view shows only flag, open view shows country names reliably */}
                  <div className="relative" ref={countryListRef}>
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={showCountryList}
                      onClick={() => setShowCountryList(s => !s)}
                      className="w-8 h-full flex items-center justify-center border border-r-0 border-gray-300 bg-white rounded-l-lg focus:outline-none"
                      title={phoneCountry}
                    >
                      {getFlagIcon(phoneCountry)}
                    </button>
                    {showCountryList && (
                      <ul role="listbox" aria-label="Select country" className="absolute z-50 mt-1 left-0 bg-white border rounded-md shadow-lg w-48 max-h-60 overflow-auto">
                        {Object.entries(countryDefs).map(([code, def]) => (
                          <li
                            key={code}
                            role="option"
                            aria-selected={phoneCountry === code}
                            onClick={() => { setPhoneCountry(code); setShowCountryList(false); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setPhoneCountry(code); setShowCountryList(false); } }}
                            tabIndex={0}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 ${phoneCountry === code ? 'bg-gray-100' : ''}`}
                          >
                            <span className="inline-block">{getFlagIcon(code)}</span>
                            <span className="text-sm text-gray-800">{def.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder={`e.g. 6XX XXX XXX`}
                  className="flex-1 px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              {errors.phoneNumber && <p className="text-sm text-red-600 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
              {currentBranch ? (
                <div>
                  <div className="px-3 py-2 border border-gray-200 rounded bg-gray-50">{(currentBranch as any).name}</div>
                  <input type="hidden" name="branchId" value={(currentBranch as any)._id || (currentBranch as any).id || ''} />
                </div>
              ) : (
                <>
                  <select
                    name="branchId"
                    value={(formData as any).branchId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Branch</option>
                    {Array.isArray(branches) && branches.map(b => (
                      <option key={(b as any)._id || (b as any).id} value={((b as any)._id || (b as any).id) as string}>{(b as any).name}</option>
                    ))}
                  </select>
                  {errors.branchId && <p className="text-sm text-red-600 mt-1">{errors.branchId}</p>}
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
              <select
                name="specialtyId"
                value={(formData as any).specialtyId || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Specialty</option>
                {specialties.map(spec => (
                  <option key={spec._id || spec.id} value={(spec._id || spec.id) as string}>{spec.name}</option>
                ))}
              </select>
              {errors.specialtyId && <p className="text-sm text-red-600 mt-1">{errors.specialtyId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tuition Plan (optional)</label>
              <select
                name="tuitionPlanId"
                value={(formData as any).tuitionPlanId || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Use default / none</option>
                {tuitionPlans.map((p: any) => (
                  <option key={p._id || p.id} value={(p._id || p.id) as string}>
                    {p.academicYear ? `${p.academicYear} - ` : ''}{p.program && p.program.name ? p.program.name : (p.department && p.department.name ? p.department.name : `Plan ${p._id}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Plans (optional)</label>
              <div className="border rounded">
                <div className="p-2 space-y-1 max-h-36 overflow-auto">
                  {paymentPlans.length === 0 && <div className="text-sm text-gray-500">No payment plans available</div>}
                  {paymentPlans.map(pp => (
                    <label key={(pp._id || pp.id)} className="flex items-center space-x-2 px-2 py-1">
                      <input type="checkbox" value={(pp._id || pp.id)} checked={selectedPaymentPlans.includes((pp._id || pp.id) as string)} onChange={(e) => {
                        const id = String(e.target.value);
                        setSelectedPaymentPlans(prev => e.target.checked ? [...prev, id] : prev.filter(p => p !== id));
                      }} />
                      <div className="text-sm">
                        <div className="font-medium">{pp.name}</div>
                        <div className="text-xs text-gray-500">{pp.description || ''} — {pp.targetAmount} XAF</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session *</label>
              <select
                name="session"
                value={formData.session}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Session</option>
                <option value="Day">Day</option>
                <option value="Evening">Evening</option>
              </select>
              {errors.session && <p className="text-sm text-red-600 mt-1">{errors.session}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
              <select
                name="academicYear"
                value={(formData as any).academicYear || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Academic Year</option>
                {(() => {
                  const y = new Date().getFullYear();
                  const opts = [ `${y}-${y+1}`, `${y-1}-${y}`, `${y+1}-${y+2}` ];
                  return opts.map(o => <option key={o} value={o}>{o}</option>);
                })()}
              </select>
              {errors.academicYear && <p className="text-sm text-red-600 mt-1">{errors.academicYear}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={1}>Level 1</option>
                <option value={2}>Level 2</option>
                <option value={3}>Level 3</option>
                <option value={4}>Level 4</option>
              </select>
              {errors.level && <p className="text-sm text-red-600 mt-1">{errors.level}</p>}
            </div>
          </div>
        </div>

        {/* Profile Photo */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
          <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {thumbnail ? (
                <img src={thumbnail} alt="profile" className="w-full h-full object-cover" />
              ) : formData.profilePicture ? (
                <img src={formData.profilePicture} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // client-side file-size check (5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    setImageWarning('File too large. Max size is 5MB.');
                    setSelectedFile(null);
                    return;
                  }
                  // keep raw file for upload
                  setSelectedFile(file);
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result as string;
                    // check aspect ratio
                    const img = new Image();
                    img.onload = () => {
                      if (img.width !== img.height) {
                        setImageWarning('Recommended: square image. Uploaded image is not square.');
                      } else {
                        setImageWarning('');
                      }
                      // generate a small thumbnail for preview to save memory
                      try {
                        const canvas = document.createElement('canvas');
                        const size = 160; // thumbnail size
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, size, size);
                          const thumb = canvas.toDataURL('image/jpeg', 0.7);
                          setThumbnail(thumb);
                        }
                      } catch (e) {
                        setThumbnail(dataUrl);
                      }
                      // keep a preview data URL for quick display but real upload will use the file
                      setFormData(prev => ({ ...prev, profilePicture: dataUrl }));
                    };
                    img.src = dataUrl;
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
                id="profileUpload"
              />
              <label htmlFor="profileUpload" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">Square image recommended. JPG/PNG up to 2MB</p>
              {imageWarning && <p className="text-sm text-yellow-600 mt-1">{imageWarning}</p>}
            </div>
          </div>
        </div>

        {/* Region of Origin */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Region of Origin</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
            <select value={region} onChange={(e) => { setRegion(e.target.value); setFormData(prev => ({ ...prev, regionOfOrigin: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select Region</option>
              {[
                'Adamawa','Centre','East','Far North','Littoral','North','Northwest','West','South','Southwest','Centre-Region','Extreme North'
              ].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name *</label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.guardianName && <p className="text-sm text-red-600 mt-1">{errors.guardianName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Contact *</label>
              <div className="flex">
                <div className="relative" ref={guardianListRef}>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={showGuardianList}
                    onClick={() => setShowGuardianList(s => !s)}
                    className="w-8 h-full flex items-center justify-center border border-r-0 border-gray-300 bg-white rounded-l-lg focus:outline-none"
                    title={guardianCountry}
                  >
                    {getFlagIcon(guardianCountry)}
                  </button>
                  {showGuardianList && (
                    <ul role="listbox" aria-label="Select guardian country" className="absolute z-50 mt-1 left-0 bg-white border rounded-md shadow-lg w-48 max-h-60 overflow-auto">
                      {Object.entries(countryDefs).map(([code, def]) => (
                        <li
                          key={code}
                          role="option"
                          aria-selected={guardianCountry === code}
                          onClick={() => { setGuardianCountry(code); setShowGuardianList(false); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setGuardianCountry(code); setShowGuardianList(false); } }}
                          tabIndex={0}
                          className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center space-x-2 ${guardianCountry === code ? 'bg-gray-100' : ''}`}
                        >
                          <span className="inline-block">{getFlagIcon(code)}</span>
                          <span className="text-sm text-gray-800">{def.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input
                  type="tel"
                  name="guardianContact"
                  value={formData.guardianContact}
                  onChange={handleInputChange}
                  placeholder="+237 6XX XXX XXX"
                  className="flex-1 px-3 py-2 border-t border-b border-r border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {errors.guardianContact && <p className="text-sm text-red-600 mt-1">{errors.guardianContact}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Address *</label>
              <textarea
                name="guardianAddress"
                value={formData.guardianAddress}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.guardianAddress && <p className="text-sm text-red-600 mt-1">{errors.guardianAddress}</p>}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            disabled={uploading || submitting}
          >
            <Save className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Register Student'}</span>
          </button>
        </div>
      </form>

      {/* Success / Error modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowSuccessModal(false)} />
          <div className="bg-white rounded-lg shadow-lg z-60 max-w-md w-full p-6 mx-4">
            <h3 className="text-lg font-semibold mb-2">Notification</h3>
            <p className="text-gray-700 mb-4">{modalMessage}</p>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};