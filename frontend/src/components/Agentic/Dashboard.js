import React, { useState } from 'react';
import { MainServices } from '../../services/MainServices';

const DESTINATION_OPTIONS = [
    { name: "Bengaluru", code: "BLR", label: "Bengaluru (BLR)" },
    { name: "Goa", code: "GOI", label: "Goa (GOI)" },
    { name: "Mumbai", code: "BOM", label: "Mumbai (BOM)" },
    { name: "Delhi", code: "DEL", label: "Delhi (DEL)" },
    { name: "Chennai", code: "MAA", label: "Chennai (MAA)" },
    { name: "Hyderabad", code: "HYD", label: "Hyderabad (HYD)" },
    { name: "Kolkata", code: "CCU", label: "Kolkata (CCU)" },
    { name: "Kochi", code: "COK", label: "Kochi (COK)" },
    { name: "Jaipur", code: "JAI", label: "Jaipur (JAI)" },
    { name: "Udaipur", code: "UDR", label: "Udaipur (UDR)" },
    { name: "Varanasi", code: "VNS", label: "Varanasi (VNS)" },
    { name: "Agra", code: "AGR", label: "Agra (AGR)" },
    { name: "Amritsar", code: "ATQ", label: "Amritsar (ATQ)" },
    { name: "Srinagar", code: "SXR", label: "Srinagar (SXR)" },
    { name: "Leh", code: "IXL", label: "Leh / Ladakh (IXL)" },
    { name: "Port Blair", code: "IXZ", label: "Port Blair / Andaman (IXZ)" },
    { name: "Darjeeling", code: "IXB", label: "Darjeeling (IXB)" },
    { name: "Guwahati", code: "GAU", label: "Guwahati (GAU)" },
    { name: "Bhubaneswar", code: "BBI", label: "Bhubaneswar / Puri (BBI)" },
    { name: "Ahmedabad", code: "AMD", label: "Ahmedabad (AMD)" },
    { name: "Pune", code: "PNQ", label: "Pune (PNQ)" },
    { name: "Chandigarh", code: "IXC", label: "Chandigarh (IXC)" },
    { name: "Coimbatore", code: "CJB", label: "Coimbatore / Ooty (CJB)" },
    { name: "Madurai", code: "IXM", label: "Madurai (IXM)" },
    { name: "Mangaluru", code: "IXE", label: "Mangaluru (IXE)" },
    { name: "Visakhapatnam", code: "VTZ", label: "Visakhapatnam (VTZ)" },
    { name: "Indore", code: "IDR", label: "Indore (IDR)" },
    { name: "Dehradun", code: "DED", label: "Dehradun / Rishikesh (DED)" },
    { name: "Kullu", code: "KUU", label: "Kullu / Manali (KUU)" },
    { name: "Khajuraho", code: "HJR", label: "Khajuraho (HJR)" },
    { name: "Jodhpur", code: "JDH", label: "Jodhpur (JDH)" },
    { name: "Jaisalmer", code: "JSA", label: "Jaisalmer (JSA)" },
    { name: "Gaya", code: "GAY", label: "Gaya / Bodh Gaya (GAY)" },
    { name: "Tirupati", code: "TIR", label: "Tirupati (TIR)" },
];

function AgenticDashboard() {
    // Form Input State mapped exactly to backend Zod schema structure
    const [formData, setFormData] = useState({
        destination: 'Goa',
        origin: 'Bengaluru',
        budget: 2500,
        startDate: '',
        durationDays: 5,
        preferences: {
            flightClass: 'economy', // 'economy' | 'business'
            hotelRating: 4,         // 1..5
            pace: 'relaxed'         // 'relaxed' | 'packed'
        },
        missingInfoAcknowledged: false
    });

    // Navigation, View & Loading States
    const [activeStep, setActiveStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [viewState, setViewState] = useState('form'); // 'form' | 'results'
    const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary' | 'flight' | 'hotel' | 'raw'
    
    // Real-time Pipeline Trackers
    const [pipelineStatus, setPipelineStatus] = useState({
        validation: 'pending',   // 'pending' | 'active' | 'success' | 'error'
        itinerary: 'pending',    
        flights: 'pending',      
        hotels: 'pending',       
        finalizing: 'pending'    
    });
    const [statusMessage, setStatusMessage] = useState('Initializing Multi-Agent Pipeline...');
    const [rawLogs, setRawLogs] = useState('');
    
    // Result & Warning States
    const [resultData, setResultData] = useState(null);
    const [missingInfoData, setMissingInfoData] = useState(null);

    // Calculate tomorrow's minimum selectable date YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateString = tomorrow.toISOString().split('T')[0];

    // Handle updates for top-level keys
    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Handle updates for nested object keys
    const handleNestedChange = (parentKey, childKey, value) => {
        setFormData(prev => ({
            ...prev,
            [parentKey]: {
                ...prev[parentKey],
                [childKey]: value
            }
        }));
    };

    // Trigger orchestration engine via stream
    const handleStartOrchestration = async (overrideFormData = null) => {
        const payload = overrideFormData || formData;
        if (!payload.destination || !payload.origin || isProcessing) return;

        setIsProcessing(true);
        setMissingInfoData(null);
        setRawLogs('');
        setStatusMessage('Submitting constraints to backend validator...');
        
        // Reset pipeline states to active sequence
        setPipelineStatus({
            validation: 'active',
            itinerary: 'pending',
            flights: 'pending',
            hotels: 'pending',
            finalizing: 'pending'
        });

        try {
            await MainServices.postStreamRequest('/api/v1/agent/itinerary', payload, (streamEvent) => {
                const { data } = streamEvent;
                
                // Append log record
                const dataString = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
                setRawLogs(prev => prev + '\n' + dataString);

                if (!data || typeof data !== 'object') return;

                const { status, message, issues, partial, error } = data;

                if (error) {
                    setPipelineStatus(prev => ({ ...prev, finalizing: 'error' }));
                    setStatusMessage(error || 'An error occurred during multi-agent planning.');
                    return;
                }

                if (status === 'PLANNING_ITINERARY') {
                    setPipelineStatus({
                        validation: 'success',
                        itinerary: 'active',
                        flights: 'pending',
                        hotels: 'pending',
                        finalizing: 'pending'
                    });
                    if (message) setStatusMessage(message);
                } else if (status === 'SOURCING_TRAVEL_DATA') {
                    setPipelineStatus({
                        validation: 'success',
                        itinerary: 'success',
                        flights: 'active',
                        hotels: 'active',
                        finalizing: 'pending'
                    });
                    if (message) setStatusMessage(message);
                } else if (status === 'VERIFYING_AVAILABILITY') {
                    setPipelineStatus({
                        validation: 'success',
                        itinerary: 'success',
                        flights: 'success',
                        hotels: 'success',
                        finalizing: 'active'
                    });
                    if (message) setStatusMessage(message);
                } else if (status === 'MISSING_INFO') {
                    setPipelineStatus({
                        validation: 'success',
                        itinerary: 'success',
                        flights: 'error',
                        hotels: 'error',
                        finalizing: 'error'
                    });
                    setMissingInfoData({
                        message: message || 'Some parts of your trip could not be fully matched.',
                        issues: issues || [],
                        partial: partial || {}
                    });
                    setStatusMessage('Verification Warning: Travel constraints need review.');
                } else if (status === 'SYNTHESIZING_PLAN') {
                    setPipelineStatus({
                        validation: 'success',
                        itinerary: 'success',
                        flights: 'success',
                        hotels: 'success',
                        finalizing: 'active'
                    });
                    if (message) setStatusMessage(message);
                } else if (status === 'COMPLETE') {
                    setPipelineStatus({
                        validation: 'success',
                        itinerary: 'success',
                        flights: 'success',
                        hotels: 'success',
                        finalizing: 'success'
                    });
                    if (data.data) {
                        setResultData(data.data);
                        setIsProcessing(false);
                        setViewState('results');
                    }
                } else if (status === 'ERROR') {
                    setPipelineStatus(prev => ({ ...prev, finalizing: 'error' }));
                    if (message) setStatusMessage(message);
                }
            });
        } catch (error) {
            console.error("Orchestration pipeline execution error:", error);
            setPipelineStatus(prev => ({ ...prev, finalizing: 'error' }));
            setStatusMessage("Connection or server error during stream execution.");
        }
    };

    // Acknowledge missing info and retry compilation
    const handleProceedWithMissingInfo = () => {
        const updated = { ...formData, missingInfoAcknowledged: true };
        setFormData(updated);
        handleStartOrchestration(updated);
    };

    // Reset to start a new plan
    const handleResetForm = () => {
        setViewState('form');
        setResultData(null);
        setMissingInfoData(null);
        setIsProcessing(false);
        setActiveStep(1);
    };

    return (
        <div style={styles.container}>
            {/* Header Banner */}
            <header style={styles.header}>
                <div style={styles.brandWrapper}>
                    <div style={styles.logoBadge}>🧭</div>
                    <div>
                        <h1 style={styles.headerTitle}>VoyageCraft AI</h1>
                        <p style={styles.headerSubtitle}>Multi-Agent Travel Orchestrator</p>
                    </div>
                </div>
                <div style={styles.headerRight}>
                    {viewState === 'results' && (
                        <button onClick={handleResetForm} style={styles.buttonNewPlan}>
                            + Plan Another Trip
                        </button>
                    )}
                    <div style={styles.systemBadge}>Engine Node Active</div>
                </div>
            </header>

            {/* FORM VIEW */}
            {viewState === 'form' && (
                <div style={styles.workspace}>
                    <div style={styles.formCard}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Configure Route Constraints</h2>
                            <span style={styles.stepBadge}>Step {activeStep} of 3</span>
                        </div>

                        {/* Linear Wizard Tracking Bar */}
                        <div style={styles.trackBarBg}>
                            <div style={{ ...styles.trackBarFill, width: `${(activeStep / 3) * 100}%` }}></div>
                        </div>

                        <div style={styles.fieldsContainer}>
                            {activeStep === 1 && (
                                <div style={styles.stepFade}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.fieldLabel}>Origin Station / City</label>
                                        <select 
                                            value={formData.origin}
                                            onChange={(e) => handleInputChange('origin', e.target.value)}
                                            style={styles.textInput}
                                        >
                                            <option value="">Select Origin City</option>
                                            {DESTINATION_OPTIONS.map((loc) => (
                                                <option key={`origin-${loc.code}`} value={loc.name}>
                                                    {loc.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.fieldLabel}>Target Destination</label>
                                        <select 
                                            value={formData.destination}
                                            onChange={(e) => handleInputChange('destination', e.target.value)}
                                            style={styles.textInput}
                                        >
                                            <option value="">Select Destination City</option>
                                            {DESTINATION_OPTIONS.map((loc) => (
                                                <option key={`dest-${loc.code}`} value={loc.name}>
                                                    {loc.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Same Location Validation Alert */}
                                    {formData.origin && formData.destination && formData.origin.toLowerCase() === formData.destination.toLowerCase() && (
                                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                                            ⚠️ Origin and target destination cannot be the same city.
                                        </div>
                                    )}

                                    {/* Popular Quick Select Chips */}
                                    <div style={{ marginTop: '8px' }}>
                                        <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>Popular Destinations:</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                            {['Goa', 'Bengaluru', 'Delhi', 'Kochi', 'Jaipur', 'Srinagar', 'Leh', 'Udaipur'].map(city => (
                                                <button
                                                    key={city}
                                                    type="button"
                                                    onClick={() => handleInputChange('destination', city)}
                                                    style={{
                                                        backgroundColor: formData.destination === city ? '#2563eb' : '#1f2937',
                                                        color: formData.destination === city ? '#ffffff' : '#9ca3af',
                                                        border: '1px solid #374151',
                                                        padding: '4px 10px',
                                                        borderRadius: '16px',
                                                        fontSize: '11px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    📍 {city}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 2 && (
                                <div style={styles.stepFade}>
                                    <div style={styles.inputGroup}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label style={styles.fieldLabel}>Allocation Budget (₹)</label>
                                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700' }}>₹ {formData.budget?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <input 
                                                type="number" 
                                                min="500" 
                                                max="100000" 
                                                step="500"
                                                placeholder="e.g. 5000"
                                                value={formData.budget || ''}
                                                onChange={(e) => handleInputChange('budget', Math.max(0, parseInt(e.target.value) || 0))}
                                                style={{ ...styles.textInput, flex: '1', fontWeight: '600' }}
                                            />
                                            <input 
                                                type="range" 
                                                min="1000" 
                                                max="50000" 
                                                step="500"
                                                value={formData.budget || 2500}
                                                onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
                                                style={{ ...styles.rangeInput, flex: '1' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.splitRow}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.fieldLabel}>Departure Window (Must be after today)</label>
                                            <input 
                                                type="date" 
                                                min={minDateString}
                                                value={formData.startDate ? formData.startDate.substring(0, 10) : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    handleInputChange('startDate', val ? new Date(val).toISOString() : '');
                                                }}
                                                style={styles.textInput}
                                            />
                                            {formData.startDate && formData.startDate.substring(0, 10) < minDateString && (
                                                <span style={{ fontSize: '11px', color: '#ef4444' }}>Departure date must be tomorrow or later.</span>
                                            )}
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.fieldLabel}>Duration (Days 1-14)</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="14"
                                                value={formData.durationDays}
                                                onChange={(e) => handleInputChange('durationDays', Math.min(14, Math.max(1, parseInt(e.target.value) || 1)))}
                                                style={styles.textInput}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeStep === 3 && (
                                <div style={styles.stepFade}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.fieldLabel}>Flight Cabin Class</label>
                                        <select 
                                            value={formData.preferences.flightClass}
                                            onChange={(e) => handleNestedChange('preferences', 'flightClass', e.target.value)}
                                            style={styles.textInput}
                                        >
                                            <option value="economy">Economy Tier</option>
                                            <option value="business">Business Class Luxe</option>
                                        </select>
                                    </div>
                                    <div style={styles.splitRow}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.fieldLabel}>Hotel Comfort Stars</label>
                                            <select 
                                                value={formData.preferences.hotelRating}
                                                onChange={(e) => handleNestedChange('preferences', 'hotelRating', parseInt(e.target.value))}
                                                style={styles.textInput}
                                            >
                                                <option value={2}>2 Star Budget</option>
                                                <option value={3}>3 Star Standard</option>
                                                <option value={4}>4 Star Quality</option>
                                                <option value={5}>5 Star Elite Luxury</option>
                                            </select>
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.fieldLabel}>Itinerary Cadence</label>
                                            <select 
                                                value={formData.preferences.pace}
                                                onChange={(e) => handleNestedChange('preferences', 'pace', e.target.value)}
                                                style={styles.textInput}
                                            >
                                                <option value="relaxed">Relaxed / Leisurely</option>
                                                <option value="packed">Packed / Fast-Paced</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Missing Info Guardrail Toggle */}
                                    <div style={styles.toggleWrapper}>
                                        <input 
                                            type="checkbox" 
                                            id="missingInfoAcknowledged"
                                            checked={formData.missingInfoAcknowledged}
                                            onChange={(e) => handleInputChange('missingInfoAcknowledged', e.target.checked)}
                                            style={styles.checkboxInput}
                                        />
                                        <label htmlFor="missingInfoAcknowledged" style={styles.checkboxLabel}>
                                            Acknowledge validation bypass: Allow system agents to drop back down to safe baseline properties instead of rejecting input payloads.
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stepper Footer Controls */}
                        <div style={styles.actionRow}>
                            {activeStep > 1 ? (
                                <button type="button" onClick={() => setActiveStep(prev => prev - 1)} style={styles.buttonSecondary}>
                                    Previous Step
                                </button>
                            ) : <div />}

                            {activeStep < 3 ? (
                                <button 
                                    type="button" 
                                    onClick={() => setActiveStep(prev => prev + 1)} 
                                    disabled={
                                        (activeStep === 1 && (!formData.origin || !formData.destination || (formData.origin.toLowerCase() === formData.destination.toLowerCase()))) ||
                                        (activeStep === 2 && (!formData.startDate || formData.startDate.substring(0, 10) < minDateString))
                                    }
                                    style={
                                        (activeStep === 1 && (!formData.origin || !formData.destination || (formData.origin.toLowerCase() === formData.destination.toLowerCase()))) ||
                                        (activeStep === 2 && (!formData.startDate || formData.startDate.substring(0, 10) < minDateString))
                                            ? styles.buttonDisabled 
                                            : styles.buttonPrimary
                                    }
                                >
                                    Continue
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={() => handleStartOrchestration()}
                                    style={styles.buttonLaunch}
                                >
                                    Compile Multi-Agent Plan 🚀
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* RESULTS VIEW */}
            {viewState === 'results' && resultData && (
                <div style={styles.resultsContainer}>
                    {/* Top Overview Banner */}
                    <div style={styles.heroBanner}>
                        <div style={styles.heroDetails}>
                            <h2 style={styles.heroTitle}>
                                ✈️ {formData.origin} to 🏖️ {formData.destination}
                            </h2>
                            <p style={styles.heroSub}>
                                {formData.durationDays} Days Itinerary • {formData.preferences.flightClass.toUpperCase()} Class • {formData.preferences.hotelRating}★ Hotels • {formData.preferences.pace.toUpperCase()} Pace
                            </p>
                        </div>
                        <div style={styles.heroActions}>
                            <button onClick={() => window.print()} style={styles.buttonSecondary}>
                                🖨️ Print Itinerary
                            </button>
                            <button onClick={handleResetForm} style={styles.buttonPrimary}>
                                🔄 New Search
                            </button>
                        </div>
                    </div>

                    {/* Warnings / Caveats Banner if any */}
                    {resultData.availabilityIssues && resultData.availabilityIssues.length > 0 && (
                        <div style={styles.warningBanner}>
                            <div style={styles.warningTitle}>⚠️ Availability Caveats & Buffer Adjustments</div>
                            <ul style={styles.warningList}>
                                {resultData.availabilityIssues.map((issue, idx) => (
                                    <li key={idx}>{issue.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sub-Navigation Tabs */}
                    <div style={styles.tabBar}>
                        <button 
                            onClick={() => setActiveTab('itinerary')} 
                            style={activeTab === 'itinerary' ? styles.tabActive : styles.tabInactive}
                        >
                            📅 Day-by-Day Plan
                        </button>
                        <button 
                            onClick={() => setActiveTab('flight')} 
                            style={activeTab === 'flight' ? styles.tabActive : styles.tabInactive}
                        >
                            ✈️ Flight ({resultData.itinerary?.selectedFlight?.airline || 'Selected'})
                        </button>
                        <button 
                            onClick={() => setActiveTab('hotel')} 
                            style={activeTab === 'hotel' ? styles.tabActive : styles.tabInactive}
                        >
                            🏨 Hotel ({resultData.itinerary?.selectedHotel?.name || 'Selected'})
                        </button>
                        <button 
                            onClick={() => setActiveTab('raw')} 
                            style={activeTab === 'raw' ? styles.tabActive : styles.tabInactive}
                        >
                            📄 Raw JSON Output
                        </button>
                    </div>

                    {/* TAB CONTENT: ITINERARY */}
                    {activeTab === 'itinerary' && (
                        <div style={styles.tabBody}>
                            {/* Summary narrative card */}
                            {resultData.itinerary?.summary && (
                                <div style={styles.summaryCard}>
                                    <h3 style={styles.summaryHeader}>Trip Summary & Strategy</h3>
                                    <p style={styles.summaryText}>{resultData.itinerary.summary}</p>
                                </div>
                            )}

                            {/* Days Timeline */}
                            <div style={styles.daysTimeline}>
                                {resultData.itinerary?.days?.map((dayObj) => (
                                    <div key={dayObj.day} style={styles.dayCard}>
                                        <div style={styles.dayHeader}>
                                            <span style={styles.dayBadge}>Day {dayObj.day}</span>
                                            <h4 style={styles.dayTitle}>{dayObj.title}</h4>
                                        </div>
                                        <ul style={styles.activityList}>
                                            {dayObj.activities?.map((act, i) => (
                                                <li key={i} style={styles.activityItem}>
                                                    <span style={styles.activityBullet}>📌</span>
                                                    <span>{act}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: FLIGHT */}
                    {activeTab === 'flight' && (
                        <div style={styles.tabBody}>
                            {resultData.itinerary?.selectedFlight && (
                                <div style={styles.featuredCard}>
                                    <div style={styles.featuredTag}>Best Match Selected Flight</div>
                                    <div style={styles.flightRow}>
                                        <div>
                                            <h3 style={styles.cardMainTitle}>{resultData.itinerary.selectedFlight.airline}</h3>
                                            <span style={styles.codeBadge}>{resultData.itinerary.selectedFlight.flightNumber}</span>
                                        </div>
                                        <div style={styles.priceTag}>
                                            {resultData.itinerary.selectedFlight.currency || '₹'} {resultData.itinerary.selectedFlight.price?.toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={styles.flightDetailsGrid}>
                                        <div>
                                            <div style={styles.detailLabel}>Origin & Departure</div>
                                            <div style={styles.detailValue}>{resultData.itinerary.selectedFlight.origin}</div>
                                            <div style={styles.detailSub}>{new Date(resultData.itinerary.selectedFlight.departureTime).toLocaleString()}</div>
                                        </div>
                                        <div style={styles.flightArrow}>✈️ ➔</div>
                                        <div>
                                            <div style={styles.detailLabel}>Destination & Arrival</div>
                                            <div style={styles.detailValue}>{resultData.itinerary.selectedFlight.destination}</div>
                                            <div style={styles.detailSub}>{new Date(resultData.itinerary.selectedFlight.arrivalTime).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={styles.detailLabel}>Cabin Class</div>
                                            <div style={styles.detailValue}>{resultData.itinerary.selectedFlight.class?.toUpperCase()}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {resultData.flights?.length > 1 && (
                                <div style={styles.altSection}>
                                    <h4 style={styles.sectionTitle}>All Available Sourced Flights ({resultData.flights.length})</h4>
                                    <div style={styles.altGrid}>
                                        {resultData.flights.map((flight, idx) => (
                                            <div key={flight.id || idx} style={styles.altCard}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <strong>{flight.airline}</strong>
                                                    <span style={styles.priceSmall}>{flight.currency || '₹'} {flight.price}</span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                    Flight: {flight.flightNumber} | Class: {flight.class}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                                    {new Date(flight.departureTime).toLocaleTimeString()} ➔ {new Date(flight.arrivalTime).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: HOTEL */}
                    {activeTab === 'hotel' && (
                        <div style={styles.tabBody}>
                            {resultData.itinerary?.selectedHotel && (
                                <div style={styles.featuredCard}>
                                    <div style={styles.featuredTag}>Best Match Selected Hotel</div>
                                    <div style={styles.flightRow}>
                                        <div>
                                            <h3 style={styles.cardMainTitle}>{resultData.itinerary.selectedHotel.name}</h3>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                                <span style={styles.ratingStars}>{'★'.repeat(resultData.itinerary.selectedHotel.rating || 4)}</span>
                                                <span style={styles.reviewBadge}>Score: {resultData.itinerary.selectedHotel.reviewScore || 8.0} / 10</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={styles.priceTag}>
                                                {resultData.itinerary.selectedHotel.currency || '₹'} {resultData.itinerary.selectedHotel.pricePerNight?.toLocaleString()} <span style={{ fontSize: '12px', color: '#9ca3af' }}>/ night</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                                                Total Stay: {resultData.itinerary.selectedHotel.currency || '₹'} {resultData.itinerary.selectedHotel.totalPrice?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <p style={styles.hotelDesc}>{resultData.itinerary.selectedHotel.description}</p>

                                    {resultData.itinerary.selectedHotel.amenities && (
                                        <div style={styles.amenitiesContainer}>
                                            {resultData.itinerary.selectedHotel.amenities.map((amenity, i) => (
                                                <span key={i} style={styles.amenityChip}>✔ {amenity}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div style={styles.hotelMetaRow}>
                                        <span>📍 Location: {resultData.itinerary.selectedHotel.location}</span>
                                        <span>📅 Check-in: {resultData.itinerary.selectedHotel.checkInDate}</span>
                                        <span>📅 Check-out: {resultData.itinerary.selectedHotel.checkOutDate}</span>
                                    </div>
                                </div>
                            )}

                            {resultData.hotels?.length > 1 && (
                                <div style={styles.altSection}>
                                    <h4 style={styles.sectionTitle}>All Available Sourced Hotels ({resultData.hotels.length})</h4>
                                    <div style={styles.altGrid}>
                                        {resultData.hotels.map((hotel, idx) => (
                                            <div key={hotel.id || idx} style={styles.altCard}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <strong>{hotel.name}</strong>
                                                    <span style={styles.priceSmall}>{hotel.currency || '₹'} {hotel.pricePerNight}/night</span>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                    Rating: {'★'.repeat(hotel.rating)} | Location: {hotel.location}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: RAW JSON */}
                    {activeTab === 'raw' && (
                        <div style={styles.tabBody}>
                            <pre style={styles.jsonPre}>
                                {JSON.stringify(resultData, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            {/* FULL SCREEN ORCHESTRATOR LOADER & MISSING INFO OVERLAY */}
            {isProcessing && (
                <div style={styles.fullscreenOverlay}>
                    <div style={styles.loadingConsole}>
                        <div style={styles.loaderHeader}>
                            <h3 style={styles.loaderTitle}>Asynchronous Agent Orchestration Loop Active</h3>
                            <p style={styles.loaderSubtitle}>Mapping pipeline vectors from {formData.origin} to {formData.destination}</p>
                        </div>

                        {/* Status Message Prompt */}
                        <div style={styles.statusBox}>
                            <span style={styles.statusBoxText}>📡 {statusMessage}</span>
                        </div>

                        {/* Pipeline Progress Stages */}
                        <div style={styles.stagesList}>
                            <div style={styles.stageItem}>
                                <div style={styles.statusIndicator[pipelineStatus.validation]}></div>
                                <span style={styles.stageText(pipelineStatus.validation)}>1. Ingesting & Validating Constraints Schema</span>
                            </div>

                            <div style={styles.stageItem}>
                                <div style={styles.statusIndicator[pipelineStatus.itinerary]}></div>
                                <span style={styles.stageText(pipelineStatus.itinerary)}>2. Synthesizing Baseline Itinerary Layout Map</span>
                            </div>

                            <div style={styles.stageItem}>
                                <div style={styles.statusIndicator[pipelineStatus.flights]}></div>
                                <span style={styles.stageText(pipelineStatus.flights)}>3. Spawning Flight Registry Scraper Agent</span>
                            </div>

                            <div style={styles.stageItem}>
                                <div style={styles.statusIndicator[pipelineStatus.hotels]}></div>
                                <span style={styles.stageText(pipelineStatus.hotels)}>4. Hydrating Hotel Pricing & Distance Matrices</span>
                            </div>

                            <div style={styles.stageItem}>
                                <div style={styles.statusIndicator[pipelineStatus.finalizing]}></div>
                                <span style={styles.stageText(pipelineStatus.finalizing)}>5. Correcting Hallucinations & Finalizing Build Payload</span>
                            </div>
                        </div>

                        {/* Spinner Animation */}
                        {!missingInfoData && pipelineStatus.finalizing !== 'error' && (
                            <div style={styles.spinnerCenter}>
                                <div style={styles.globalSpinner}></div>
                                <span style={styles.spinnerText}>Streaming Server Event Tokens...</span>
                            </div>
                        )}

                        {/* MISSING INFO INTERACTIVE PROMPT MODAL */}
                        {missingInfoData && (
                            <div style={styles.missingInfoCard}>
                                <div style={styles.missingHeader}>⚠️ Trip Matching Issue Detected</div>
                                <p style={styles.missingMessage}>{missingInfoData.message}</p>
                                
                                {missingInfoData.issues && (
                                    <ul style={styles.missingIssuesList}>
                                        {missingInfoData.issues.map((issue, i) => (
                                            <li key={i}>{issue.message}</li>
                                        ))}
                                    </ul>
                                )}

                                <div style={styles.missingActions}>
                                    <button 
                                        type="button"
                                        onClick={handleProceedWithMissingInfo}
                                        style={styles.buttonLaunch}
                                    >
                                        Proceed with Safe Fallback Data
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsProcessing(false);
                                            setMissingInfoData(null);
                                        }}
                                        style={styles.buttonSecondary}
                                    >
                                        Adjust Route Constraints
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Live Raw Event Text Stream Mirror */}
                        {rawLogs && (
                            <div style={styles.rawLogContainer}>
                                <div style={styles.rawLogHeader}>RAW AGENT SSE VECTOR STREAM</div>
                                <pre style={styles.rawLogPre}>{rawLogs}</pre>
                            </div>
                        )}
                        
                        {pipelineStatus.finalizing === 'error' && !missingInfoData && (
                            <button 
                                type="button" 
                                onClick={() => setIsProcessing(false)} 
                                style={styles.abortButton}
                            >
                                Return to Configuration
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Styling definitions
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#0b0f17',
        color: '#f3f4f6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
        padding: '16px 32px',
        backgroundColor: '#111827',
        borderBottom: '1px solid #1f2937',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    brandWrapper: { display: 'flex', alignItems: 'center', gap: '14px' },
    logoBadge: { fontSize: '24px', background: '#1e293b', padding: '6px', borderRadius: '10px' },
    headerTitle: { fontSize: '16px', margin: 0, fontWeight: '700', color: '#ffffff', letterSpacing: '0.3px' },
    headerSubtitle: { fontSize: '11px', margin: 0, color: '#9ca3af' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
    systemBadge: { fontSize: '11px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' },
    buttonNewPlan: { backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
    workspace: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: '#0f172a' },
    formCard: { width: '100%', maxWidth: '520px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' },
    cardHeader: { padding: '24px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px', margin: 0 },
    stepBadge: { fontSize: '12px', color: '#3b82f6', fontWeight: '600' },
    trackBarBg: { height: '2px', width: '100%', backgroundColor: '#1f2937' },
    trackBarFill: { height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s ease-in-out' },
    fieldsContainer: { padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '220px' },
    stepFade: { display: 'flex', flexDirection: 'column', gap: '18px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    fieldLabel: { fontSize: '12px', color: '#9ca3af', fontWeight: '500' },
    textInput: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '12px', color: '#ffffff', fontSize: '14px', outline: 'none' },
    rangeInput: { width: '100%', accentColor: '#3b82f6', marginTop: '8px' },
    splitRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    toggleWrapper: { display: 'flex', gap: '12px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', marginTop: '8px', alignItems: 'flex-start' },
    checkboxInput: { marginTop: '4px', cursor: 'pointer' },
    checkboxLabel: { fontSize: '11px', color: '#9ca3af', lineHeight: '1.5', cursor: 'pointer' },
    actionRow: { padding: '20px 24px', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between' },
    buttonPrimary: { backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '13px' },
    buttonSecondary: { backgroundColor: 'transparent', color: '#9ca3af', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: '1px solid #374151', cursor: 'pointer', fontSize: '13px' },
    buttonDisabled: { backgroundColor: '#1f2937', color: '#4b5563', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'not-allowed', fontSize: '13px' },
    buttonLaunch: { backgroundColor: '#10b981', color: '#ffffff', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' },

    // RESULTS VIEW STYLES
    resultsContainer: { flex: 1, padding: '32px 48px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' },
    heroBanner: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    heroTitle: { fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: 0 },
    heroSub: { fontSize: '13px', color: '#9ca3af', marginTop: '6px', margin: 0 },
    heroActions: { display: 'flex', gap: '12px' },
    warningBanner: { backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', padding: '16px 24px', color: '#fef08a' },
    warningTitle: { fontSize: '14px', fontWeight: '700', marginBottom: '6px' },
    warningList: { margin: 0, paddingLeft: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' },
    tabBar: { display: 'flex', gap: '12px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' },
    tabActive: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' },
    tabInactive: { backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' },
    tabBody: { display: 'flex', flexDirection: 'column', gap: '24px' },
    summaryCard: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '20px 24px' },
    summaryHeader: { fontSize: '15px', fontWeight: '700', color: '#38bdf8', margin: '0 0 8px 0' },
    summaryText: { fontSize: '14px', color: '#e2e8f0', lineHeight: '1.6', margin: 0 },
    daysTimeline: { display: 'flex', flexDirection: 'column', gap: '16px' },
    dayCard: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '20px 24px' },
    dayHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
    dayBadge: { backgroundColor: '#3b82f6', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
    dayTitle: { fontSize: '16px', fontWeight: '600', color: '#f3f4f6', margin: 0 },
    activityList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' },
    activityItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: '#d1d5db', lineHeight: '1.5' },
    activityBullet: { fontSize: '14px' },
    featuredCard: { backgroundColor: '#111827', border: '1px solid #2563eb', borderRadius: '16px', padding: '24px', position: 'relative' },
    featuredTag: { position: 'absolute', top: '-12px', left: '24px', backgroundColor: '#2563eb', color: '#ffffff', padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
    flightRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    cardMainTitle: { fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 },
    codeBadge: { fontSize: '12px', backgroundColor: '#1f2937', color: '#9ca3af', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' },
    priceTag: { fontSize: '22px', fontWeight: '800', color: '#10b981' },
    flightDetailsGrid: { display: 'grid', gridTemplateColumns: '1fr auto 1fr 1fr', gap: '24px', alignItems: 'center', backgroundColor: '#0f172a', padding: '16px 20px', borderRadius: '12px', border: '1px solid #1f2937' },
    detailLabel: { fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' },
    detailValue: { fontSize: '15px', fontWeight: '700', color: '#f3f4f6', marginTop: '2px' },
    detailSub: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },
    flightArrow: { fontSize: '18px', color: '#3b82f6' },
    altSection: { marginTop: '16px' },
    sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#9ca3af', marginBottom: '12px' },
    altGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
    altCard: { backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px' },
    priceSmall: { color: '#10b981', fontWeight: '700' },
    ratingStars: { color: '#f59e0b', fontSize: '14px' },
    reviewBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
    hotelDesc: { fontSize: '13px', color: '#9ca3af', lineHeight: '1.5', margin: '16px 0' },
    amenitiesContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
    amenityChip: { backgroundColor: '#1f2937', color: '#d1d5db', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', border: '1px solid #374151' },
    hotelMetaRow: { display: 'flex', gap: '20px', fontSize: '12px', color: '#6b7280', borderTop: '1px solid #1f2937', paddingTop: '12px' },
    jsonPre: { backgroundColor: '#0b0f17', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', color: '#38bdf8', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' },

    // FULLSCREEN OVERLAY SCHEME
    fullscreenOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.96)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' },
    loadingConsole: { width: '100%', maxWidth: '640px', padding: '36px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
    loaderHeader: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' },
    loaderTitle: { fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 },
    loaderSubtitle: { fontSize: '13px', color: '#6b7280', margin: 0 },
    statusBox: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', padding: '10px 16px', textAlign: 'center' },
    statusBoxText: { fontSize: '13px', color: '#38bdf8', fontWeight: '600' },
    stagesList: { display: 'flex', flexDirection: 'column', gap: '14px' },
    stageItem: { display: 'flex', alignItems: 'center', gap: '16px' },
    stageText: (status) => ({ fontSize: '14px', fontWeight: status === 'active' ? '600' : '500', color: status === 'active' ? '#3b82f6' : status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#4b5563', transition: 'color 0.2s' }),
    statusIndicator: {
        pending: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#374151' },
        active: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 12px #3b82f6' },
        success: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 12px #10b981' },
        error: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 12px #ef4444' }
    },
    spinnerCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', margin: '4px 0' },
    globalSpinner: { width: '28px', height: '28px', border: '3px solid #1f2937', borderTopColor: '#10b981', borderRadius: '50%' },
    spinnerText: { fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' },
    missingInfoCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' },
    missingHeader: { fontSize: '14px', fontWeight: '700', color: '#fca5a5' },
    missingMessage: { fontSize: '13px', color: '#fecaca', margin: 0 },
    missingIssuesList: { margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: '4px' },
    missingActions: { display: 'flex', gap: '12px', marginTop: '4px' },
    rawLogContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
    rawLogHeader: { fontSize: '10px', color: '#4b5563', fontWeight: '700', letterSpacing: '0.5px' },
    rawLogPre: { margin: 0, padding: '12px', backgroundColor: '#0b0f17', border: '1px solid #1f2937', borderRadius: '8px', color: '#64748b', fontSize: '11px', fontFamily: 'monospace', maxHeight: '90px', overflowY: 'auto', whiteSpace: 'pre-wrap' },
    abortButton: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }
};

export default AgenticDashboard;