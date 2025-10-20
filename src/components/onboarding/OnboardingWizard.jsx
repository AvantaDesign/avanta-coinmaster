// Enhanced Onboarding Guide - Phase 38
// Integrated with database-backed progress tracking

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const steps = [
    {
      id: 'welcome',
      title: '¡Bienvenido a Avanta Finance! 👋',
      description: 'Tu sistema completo de gestión financiera'
    }
  ];

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProgress(data.data);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return null; // Simplified for now
}
