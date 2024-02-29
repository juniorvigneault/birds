// Import FilesetResolver from the appropriate module
import {
    FilesetResolver,
    ObjectDetector
} from '@mediapipe/tasks-vision'; // Adjust the import path according to the actual module structure

let objectDetector;

// Define the async function to initialize the object detector
export async function initializeObjectDetector() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "/node_modules/@mediapipe/tasks-vision/wasm"
        );
        objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-tasks/object_detector/efficientdet_lite0_uint8.tflite`
            },
            scoreThreshold: 0.5
        });

        console.log("Object detector initialized successfully!");
    } catch (error) {
        console.error("Error initializing object detector:", error);
    }
}

// Getter function to access the object detector instance
export function getObjectDetector() {
    return objectDetector;
}