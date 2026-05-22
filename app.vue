<template>
  <BgmToggle />
  <NuxtPage :transition="{ name: 'fade', mode: 'out-in' }" />
  <AchievementToast />
  <OnboardingTour />
</template>
