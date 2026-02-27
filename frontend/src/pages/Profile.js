import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { gsap } from 'gsap';

const Profile = () => {
    const { getFullProfile, saveFullProfile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [activeSection, setActiveSection] = useState('personal');

    const [formData, setFormData] = useState({

        name: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        location: '',
        permanent_address: '',
        nationality: '',

        degree: '',
        specialization: '',
        university: '',
        graduation_year: '',
        cgpa: '',
        twelfth_details: { board: '', percentage: '', year: '' },
        tenth_details: { board: '', percentage: '', year: '' },
        backlogs_count: 0,

        resume_url: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',

        skills: { languages: [], frameworks: [], databases: [], tools: [], certifications: [] },

        projects: [],

        work_experience: [],

        preferred_role: '',
        preferred_location: '',
        willing_to_relocate: false,
        work_mode: '',
        expected_salary: '',
        notice_period: '',

        screening_answers: { whyHire: '', strengths: '', weaknesses: '', projectExplanation: '', criminalRecord: false, bgVerification: false },

        declaration: { accuracyConfirmed: false, consentGiven: false, signature: '', date: '' }
    });

    const containerRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getFullProfile();
                if (profileData) {
                    const sanitize = (val) => val === null ? '' : val;
                    setFormData(prev => ({
                        ...prev,
                        ...profileData,

                        name: sanitize(profileData.name),
                        phone: sanitize(profileData.phone),
                        dob: profileData.dob ? profileData.dob.split('T')[0] : '',
                        gender: sanitize(profileData.gender),
                        location: sanitize(profileData.location),
                        permanent_address: sanitize(profileData.permanent_address),
                        nationality: sanitize(profileData.nationality),
                        degree: sanitize(profileData.degree),
                        specialization: sanitize(profileData.specialization),
                        university: sanitize(profileData.university),
                        graduation_year: sanitize(profileData.graduation_year),
                        cgpa: sanitize(profileData.cgpa),
                        resume_url: sanitize(profileData.resume_url),
                        linkedin_url: sanitize(profileData.linkedin_url),
                        github_url: sanitize(profileData.github_url),
                        portfolio_url: sanitize(profileData.portfolio_url),
                        preferred_role: sanitize(profileData.preferred_role),
                        preferred_location: sanitize(profileData.preferred_location),
                        work_mode: sanitize(profileData.work_mode),
                        expected_salary: sanitize(profileData.expected_salary),
                        notice_period: sanitize(profileData.notice_period),

                        twelfth_details: profileData.twelfth_details || prev.twelfth_details,
                        tenth_details: profileData.tenth_details || prev.tenth_details,
                        skills: profileData.skills || prev.skills,
                        projects: profileData.projects || [],
                        work_experience: profileData.work_experience || [],
                        screening_answers: profileData.screening_answers || prev.screening_answers,
                        declaration: profileData.declaration || prev.declaration
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [getFullProfile]);

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.from('.section-card', {
                    y: 20,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out'
                });
            }, containerRef.current);
            return () => ctx.revert();
        }
    }, [loading, activeSection]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await saveFullProfile(formData);
            showToast('Profile saved successfully!', 'success');
        } catch (err) {
            showToast('Failed to save profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataFile = new FormData();
        formDataFile.append('resume', file);

        setUploading(true);
        try {
            const res = await api.post('/api/upload/resume', formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, resume_url: res.data.fileUrl }));
            showToast('Resume uploaded successfully!', 'success');
        } catch (err) {
            console.error('Upload error:', err);
            showToast('Upload failed. Please check file type and size.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleAIReview = async () => {
        setAnalyzing(true);
        try {
            const res = await api.get('/api/ai/analyze-profile');
            setAiAnalysis(res.data.analysis);
            showToast('AI Review completed!', 'success');
        } catch (err) {
            console.error('AI Review error:', err);
            const errMsg = err.response?.data?.message || 'AI Review failed.';
            showToast(errMsg, 'error');
        } finally {
            setAnalyzing(false);
        }
    };

    const updateNested = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    const addListItem = (field, initialValue) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], initialValue]
        }));
    };

    const updateListItem = (field, index, value) => {
        const newList = [...formData[field]];
        newList[index] = { ...newList[index], ...value };
        setFormData(prev => ({ ...prev, [field]: newList }));
    };

    const removeListItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="loading-screen">Loading Profile...</div>;

    const sections = [
        { id: 'personal', label: '1. Personal Information', icon: '👤' },
        { id: 'education', label: '2. Education Details', icon: '🎓' },
        { id: 'links', label: '3. Resume & Profiles', icon: '🔗' },
        { id: 'skills', label: '4. Technical Skills', icon: '🛠️' },
        { id: 'projects', label: '5. Projects', icon: '💻' },
        { id: 'experience', label: '6. Work Experience', icon: '💼' },
        { id: 'preferences', label: '7. Job Preferences', icon: '🎯' },
        { id: 'screening', label: '8. Screening Questions', icon: '📝' },
        { id: 'declaration', label: '9. Declaration', icon: '✍️' },
        { id: 'ai', label: 'AI Market Analysis', icon: '🧠' }
    ];

    return (
        <div className="profile-overhaul-container" ref={containerRef}>

            <div className="profile-layout">

                <aside className="profile-sidebar">
                    <div className="sidebar-header">
                        <h2>My Profile</h2>
                        <p>Manage your professional identity</p>
                    </div>
                    <nav className="section-nav">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                className={`nav-item ${activeSection === s.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(s.id)}
                            >
                                <span className="icon">{s.icon}</span>
                                <span className="label">{s.label}</span>
                            </button>
                        ))}
                    </nav>
                    <div className="sidebar-footer">
                        <button className="btn btn-primary w-full" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'SAVE ALL DETAILS'}
                        </button>
                    </div>
                </aside>


                <main className="profile-content">
                    <form onSubmit={handleSave}>
                        {activeSection === 'personal' && (
                            <div className="section-card">
                                <h3>Personal Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" value={formData.email} disabled className="disabled" />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender (Optional)</label>
                                        <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Current Location</label>
                                        <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Mumbai, India" />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Permanent Address</label>
                                        <textarea value={formData.permanent_address} onChange={e => setFormData({ ...formData, permanent_address: e.target.value })} placeholder="Enter your full address" rows="3"></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label>Nationality</label>
                                        <input type="text" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} placeholder="Indian" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'education' && (
                            <div className="section-card">
                                <h3>Education Details</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Degree</label>
                                        <input type="text" value={formData.degree} onChange={e => setFormData({ ...formData, degree: e.target.value })} placeholder="B.E. / B.Tech / BCA" />
                                    </div>
                                    <div className="form-group">
                                        <label>Specialization / Branch</label>
                                        <input type="text" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} placeholder="Computer Science" />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>College / University Name</label>
                                        <input type="text" value={formData.university} onChange={e => setFormData({ ...formData, university: e.target.value })} placeholder="University of Mumbai" />
                                    </div>
                                    <div className="form-group">
                                        <label>Graduation Year</label>
                                        <input type="number" value={formData.graduation_year} onChange={e => setFormData({ ...formData, graduation_year: e.target.value })} placeholder="2024" />
                                    </div>
                                    <div className="form-group">
                                        <label>CGPA / Percentage</label>
                                        <input type="text" value={formData.cgpa} onChange={e => setFormData({ ...formData, cgpa: e.target.value })} placeholder="9.5 / 85%" />
                                    </div>
                                </div>

                                <div className="sub-section">
                                    <h4>12th Board Details</h4>
                                    <div className="form-grid">
                                        <div className="form-group"><label>Board</label><input type="text" value={formData.twelfth_details.board} onChange={e => updateNested('twelfth_details', 'board', e.target.value)} /></div>
                                        <div className="form-group"><label>Percentage</label><input type="text" value={formData.twelfth_details.percentage} onChange={e => updateNested('twelfth_details', 'percentage', e.target.value)} /></div>
                                        <div className="form-group"><label>Year</label><input type="number" value={formData.twelfth_details.year} onChange={e => updateNested('twelfth_details', 'year', e.target.value)} /></div>
                                    </div>
                                </div>

                                <div className="sub-section">
                                    <h4>10th Board Details</h4>
                                    <div className="form-grid">
                                        <div className="form-group"><label>Board</label><input type="text" value={formData.tenth_details.board} onChange={e => updateNested('tenth_details', 'board', e.target.value)} /></div>
                                        <div className="form-group"><label>Percentage</label><input type="text" value={formData.tenth_details.percentage} onChange={e => updateNested('tenth_details', 'percentage', e.target.value)} /></div>
                                        <div className="form-group"><label>Year</label><input type="number" value={formData.tenth_details.year} onChange={e => updateNested('tenth_details', 'year', e.target.value)} /></div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label>Backlogs (Count)</label>
                                    <input type="number" value={formData.backlogs_count} onChange={e => setFormData({ ...formData, backlogs_count: e.target.value })} placeholder="0" />
                                </div>
                            </div>
                        )}

                        {activeSection === 'links' && (
                            <div className="section-card">
                                <h3>Resume & Profiles</h3>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Resume Upload</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleResumeUpload}
                                                style={{ flex: 1 }}
                                                disabled={uploading}
                                            />
                                            {uploading && <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>UPLOADING...</span>}
                                        </div>
                                        <p className="hint">Uploaded: {formData.resume_url || 'No file yet'}</p>
                                        <input type="text" value={formData.resume_url} onChange={e => setFormData({ ...formData, resume_url: e.target.value })} placeholder="Or paste a link (Google Drive / Dropbox)" />
                                    </div>
                                    <div className="form-group">
                                        <label>LinkedIn URL</label>
                                        <input type="text" value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="linkedin.com/in/username" />
                                    </div>
                                    <div className="form-group">
                                        <label>GitHub URL</label>
                                        <input type="text" value={formData.github_url} onChange={e => setFormData({ ...formData, github_url: e.target.value })} placeholder="github.com/username" />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Portfolio / Website URL</label>
                                        <input type="text" value={formData.portfolio_url} onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })} placeholder="username.me" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'skills' && (
                            <div className="section-card">
                                <h3>Technical Skills</h3>
                                <p className="hint">Separate with commas (e.g. React, Node.js, Python)</p>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Programming Languages</label>
                                        <input type="text" value={formData.skills.languages.join(', ')} onChange={e => updateNested('skills', 'languages', e.target.value.split(',').map(s => s.trim()))} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Frameworks / Libraries</label>
                                        <input type="text" value={formData.skills.frameworks.join(', ')} onChange={e => updateNested('skills', 'frameworks', e.target.value.split(',').map(s => s.trim()))} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Databases</label>
                                        <input type="text" value={formData.skills.databases.join(', ')} onChange={e => updateNested('skills', 'databases', e.target.value.split(',').map(s => s.trim()))} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Tools / Platforms</label>
                                        <input type="text" value={formData.skills.tools.join(', ')} onChange={e => updateNested('skills', 'tools', e.target.value.split(',').map(s => s.trim()))} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Certifications</label>
                                        <input type="text" value={formData.skills.certifications.join(', ')} onChange={e => updateNested('skills', 'certifications', e.target.value.split(',').map(s => s.trim()))} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'projects' && (
                            <div className="section-card">
                                <h3>Projects</h3>
                                {formData.projects.map((project, index) => (
                                    <div key={index} className="list-item-card">
                                        <button type="button" className="remove-btn" onClick={() => removeListItem('projects', index)}>×</button>
                                        <div className="form-grid">
                                            <div className="form-group full-width"><label>Project Title</label><input type="text" value={project.title} onChange={e => updateListItem('projects', index, { title: e.target.value })} /></div>
                                            <div className="form-group full-width"><label>Description</label><textarea value={project.description} onChange={e => updateListItem('projects', index, { description: e.target.value })} rows="2"></textarea></div>
                                            <div className="form-group"><label>Technologies Used</label><input type="text" value={project.technologies} onChange={e => updateListItem('projects', index, { technologies: e.target.value })} /></div>
                                            <div className="form-group"><label>Your Role</label><input type="text" value={project.role} onChange={e => updateListItem('projects', index, { role: e.target.value })} /></div>
                                            <div className="form-group"><label>Duration</label><input type="text" value={project.duration} onChange={e => updateListItem('projects', index, { duration: e.target.value })} /></div>
                                            <div className="form-group"><label>GitHub Link</label><input type="text" value={project.githubLink} onChange={e => updateListItem('projects', index, { githubLink: e.target.value })} /></div>
                                            <div className="form-group full-width"><label>Live Demo Link</label><input type="text" value={project.liveDemoLink} onChange={e => updateListItem('projects', index, { liveDemoLink: e.target.value })} /></div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-outline w-full" onClick={() => addListItem('projects', { title: '', description: '', technologies: '', role: '', duration: '', githubLink: '', liveDemoLink: '' })}>+ ADD PROJECT</button>
                            </div>
                        )}

                        {activeSection === 'experience' && (
                            <div className="section-card">
                                <h3>Work Experience / Internship</h3>
                                {formData.work_experience.map((exp, index) => (
                                    <div key={index} className="list-item-card">
                                        <button type="button" className="remove-btn" onClick={() => removeListItem('work_experience', index)}>×</button>
                                        <div className="form-grid">
                                            <div className="form-group"><label>Company Name</label><input type="text" value={exp.company} onChange={e => updateListItem('work_experience', index, { company: e.target.value })} /></div>
                                            <div className="form-group"><label>Job Title / Role</label><input type="text" value={exp.title} onChange={e => updateListItem('work_experience', index, { title: e.target.value })} /></div>
                                            <div className="form-group"><label>Employment Type</label>
                                                <select value={exp.type} onChange={e => updateListItem('work_experience', index, { type: e.target.value })}>
                                                    <option value="Full-time">Full-time</option>
                                                    <option value="Internship">Internship</option>
                                                    <option value="Freelance">Freelance</option>
                                                </select>
                                            </div>
                                            <div className="form-group"><label>Start Date</label><input type="date" value={exp.startDate} onChange={e => updateListItem('work_experience', index, { startDate: e.target.value })} /></div>
                                            <div className="form-group"><label>End Date</label><input type="date" value={exp.endDate} onChange={e => updateListItem('work_experience', index, { endDate: e.target.value })} /></div>
                                            <div className="form-group full-width"><label>Responsibilities Summary</label><textarea value={exp.summary} onChange={e => updateListItem('work_experience', index, { summary: e.target.value })} rows="3"></textarea></div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-outline w-full" onClick={() => addListItem('work_experience', { company: '', title: '', type: 'Full-time', startDate: '', endDate: '', summary: '' })}>+ ADD EXPERIENCE</button>
                            </div>
                        )}

                        {activeSection === 'preferences' && (
                            <div className="section-card">
                                <h3>Job Preferences</h3>
                                <div className="form-grid">
                                    <div className="form-group"><label>Preferred Role</label><input type="text" value={formData.preferred_role} onChange={e => setFormData({ ...formData, preferred_role: e.target.value })} placeholder="Software Engineer" /></div>
                                    <div className="form-group"><label>Preferred Location</label><input type="text" value={formData.preferred_location} onChange={e => setFormData({ ...formData, preferred_location: e.target.value })} placeholder="Remote / Bengaluru" /></div>
                                    <div className="form-group"><label>Willing to Relocate</label>
                                        <select value={formData.willing_to_relocate} onChange={e => setFormData({ ...formData, willing_to_relocate: e.target.value === 'true' })}>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Work Mode Preference</label>
                                        <select value={formData.work_mode} onChange={e => setFormData({ ...formData, work_mode: e.target.value })}>
                                            <option value="Office">Office</option>
                                            <option value="Remote">Remote</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Expected Salary</label><input type="text" value={formData.expected_salary} onChange={e => setFormData({ ...formData, expected_salary: e.target.value })} placeholder="e.g. 10 LPA" /></div>
                                    <div className="form-group"><label>Notice Period / Availability</label><input type="text" value={formData.notice_period} onChange={e => setFormData({ ...formData, notice_period: e.target.value })} placeholder="Immediate / 30 days" /></div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'screening' && (
                            <div className="section-card">
                                <h3>Screening Questions</h3>
                                <div className="form-group full-width"><label>Why should we hire you?</label><textarea value={formData.screening_answers.whyHire} onChange={e => updateNested('screening_answers', 'whyHire', e.target.value)} rows="3"></textarea></div>
                                <div className="form-grid">
                                    <div className="form-group"><label>Strengths</label><input type="text" value={formData.screening_answers.strengths} onChange={e => updateNested('screening_answers', 'strengths', e.target.value)} /></div>
                                    <div className="form-group"><label>Weaknesses</label><input type="text" value={formData.screening_answers.weaknesses} onChange={e => updateNested('screening_answers', 'weaknesses', e.target.value)} /></div>
                                </div>
                                <div className="form-group full-width"><label>Explain one project in detail</label><textarea value={formData.screening_answers.projectExplanation} onChange={e => updateNested('screening_answers', 'projectExplanation', e.target.value)} rows="4"></textarea></div>
                                <div className="form-grid">
                                    <div className="form-group"><label>Any criminal record?</label>
                                        <select value={formData.screening_answers.criminalRecord} onChange={e => updateNested('screening_answers', 'criminalRecord', e.target.value === 'true')}>
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Comfortable with BG Verification?</label>
                                        <select value={formData.screening_answers.bgVerification} onChange={e => updateNested('screening_answers', 'bgVerification', e.target.value === 'true')}>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'declaration' && (
                            <div className="section-card">
                                <h3>Declaration</h3>
                                <div className="declaration-box">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={formData.declaration.accuracyConfirmed} onChange={e => updateNested('declaration', 'accuracyConfirmed', e.target.checked)} />
                                        I hereby declare that all the information provided above is true and accurate to the best of my knowledge.
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={formData.declaration.consentGiven} onChange={e => updateNested('declaration', 'consentGiven', e.target.checked)} />
                                        I give my consent for background verification of the information provided in this profile.
                                    </label>
                                    <div className="form-grid" style={{ marginTop: '30px' }}>
                                        <div className="form-group"><label>Digital Signature / Full Name</label><input type="text" value={formData.declaration.signature} onChange={e => updateNested('declaration', 'signature', e.target.value)} /></div>
                                        <div className="form-group"><label>Date</label><input type="date" value={formData.declaration.date} onChange={e => updateNested('declaration', 'date', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'ai' && (
                            <div className="section-card">
                                <h3>AI Market Analysis</h3>
                                {!aiAnalysis ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🧠</div>
                                        <h4 style={{ marginBottom: '15px' }}>Get your profile analyzed by Gemini 1.5 Pro</h4>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px' }}>
                                            We'll analyze your skills, projects, and experience to give you a market readiness score and career suggestions.
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleAIReview}
                                            disabled={analyzing}
                                            style={{ padding: '15px 40px' }}
                                        >
                                            {analyzing ? 'ANALYZING PROFILE...' : 'START AI REVIEW'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ai-report">
                                        <div style={{ display: 'flex', gap: '30px', alignItems: 'center', marginBottom: '40px', background: 'var(--bg-secondary)', padding: '30px', borderRadius: '20px', border: '3px solid var(--border)' }}>
                                            <div className="score-gauge" style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'white', border: '5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, boxShadow: '5px 5px 0 var(--border)' }}>
                                                {aiAnalysis.readinessScore}%
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>Market Readiness Score</h4>
                                                <p style={{ fontWeight: 700, opacity: 0.8 }}>{aiAnalysis.marketAnalysis}</p>
                                            </div>
                                        </div>

                                        <div className="form-grid">
                                            <div className="card" style={{ padding: '24px', background: '#F0FFF4', border: '2px solid #22543D' }}>
                                                <h5 style={{ color: '#22543D', fontWeight: 900, marginBottom: '15px' }}>✅ STRENGTHS</h5>
                                                <ul style={{ paddingLeft: '20px', fontWeight: 700 }}>
                                                    {aiAnalysis.strengths.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
                                                </ul>
                                            </div>
                                            <div className="card" style={{ padding: '24px', background: '#FFF5F5', border: '2px solid #822727' }}>
                                                <h5 style={{ color: '#822727', fontWeight: 900, marginBottom: '15px' }}>🚀 AREAS TO IMPROVE</h5>
                                                <ul style={{ paddingLeft: '20px', fontWeight: 700 }}>
                                                    {aiAnalysis.improvements.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>{s}</li>)}
                                                </ul>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '30px', padding: '24px', border: '3px solid var(--border)', borderRadius: '20px' }}>
                                            <h5 style={{ fontWeight: 900, marginBottom: '15px' }}>🎯 SUGGESTED ROLES</h5>
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                {aiAnalysis.suggestedRoles.map((role, i) => (
                                                    <span key={i} className="badge" style={{ background: 'var(--accent-blue)', color: 'white', border: '2px solid var(--border)', padding: '8px 20px', borderRadius: '100px', fontWeight: 800 }}>
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-outline w-full"
                                            style={{ marginTop: '30px' }}
                                            onClick={() => setAiAnalysis(null)}
                                        >
                                            REFRESH ANALYSIS
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </main>
            </div>
        </div>
    );
};

export default Profile;
