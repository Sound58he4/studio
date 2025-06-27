"use client";

import { useToast } from '@/hooks/use-toast';
import { Crown, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export interface UpgradeNotificationProps {
  title?: string;
  description?: string;
  sender?: string;
  autoShow?: boolean;
  delay?: number;
}

export const useUpgradeNotification = () => {
  const { toast } = useToast();
  const router = useRouter();

  const showUpgradeNotification = ({
    title = "🏋️ Upgrade to Pro",
    description = "Unlock advanced features for your fitness journey",
    sender = "Bago Fitness Team",
    autoShow = false,
    delay = 1000
  }: UpgradeNotificationProps = {}) => {
    
    const showToast = () => {
      toast({
        title,
        description: `${description} • From: ${sender}`,
        duration: 8000,
        action: (
          <Button
            size="sm"
            onClick={() => router.push('/pro-upgrade')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Crown className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        ),
      });
    };

    if (autoShow) {
      setTimeout(showToast, delay);
    } else {
      showToast();
    }
  };

  const showFeatureLockedNotification = (featureName: string) => {
    toast({
      title: "🔒 Pro Feature",
      description: `${featureName} is available in Pro version • From: Bago Fitness Team`,
      duration: 6000,
      action: (
        <Button
          size="sm"
          onClick={() => router.push('/pro-upgrade')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade
        </Button>
      ),
    });
  };

  const showUpgradeSuccessNotification = (planType: string) => {
    toast({
      title: "🎉 Welcome to Pro!",
      description: `Your ${planType} plan is now active. All premium features unlocked! • From: Bago Fitness Team`,
      duration: 10000,
    });
  };

  const showUpgradeProcessingNotification = (planType: string) => {
    toast({
      title: "🚀 Upgrade Processing",
      description: `Your ${planType} upgrade is being processed • From: Bago Fitness Pro`,
      duration: 6000,
    });
  };

  return {
    showUpgradeNotification,
    showFeatureLockedNotification,
    showUpgradeSuccessNotification,
    showUpgradeProcessingNotification,
  };
};

// Component for triggering upgrade notifications
export const UpgradeNotificationTrigger = ({
  title,
  description,
  sender,
  autoShow = true,
  delay = 1000,
  children
}: UpgradeNotificationProps & { children?: React.ReactNode }) => {
  const { showUpgradeNotification } = useUpgradeNotification();

  // Auto-show notification if enabled
  if (autoShow) {
    showUpgradeNotification({ title, description, sender, autoShow, delay });
  }

  return <>{children}</>;
};

export default useUpgradeNotification;
