import fs from "fs";
import http from "http";

export function formatDate(date) {
  return new Date(date).toISOString();
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sendAnalytics() {}
export function logPerformance(metrics) {}
export function cleanupTemp() {}
