import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from pathlib import Path
from .labels import CLASS_NAMES
from .services import get_disease_treatment
from .models import DiseaseTreatment
import gc

# Set device to GPU to speed up training if available
if torch.cuda.is_available():
    device = torch.device("cuda") # NVIDIA GPU
elif torch.backends.mps.is_available():
    device = torch.device("mps") # Apple Silicon GPU
else:
    device = torch.device("cpu")

# To make images compatible with the model
transform = transforms.Compose([
    transforms.Resize(256), # Resize images to 256x256 pixels
    transforms.CenterCrop(224), # Crop the centre to 224x224 pixels
    transforms.ToTensor(), # Convert images to Pytorch tensors
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])      # Normalise images using the mean and standard deviation of the ImageNet dataset
    ])

def load_model():
    """ Load the trained plant disease identifier model. """

    # Load the default model from pytorch
    model = models.resnet18(weights=None)

    # Replace the final layer
    in_features = model.fc.in_features
    num_classes = len(CLASS_NAMES)

    model.fc = nn.Linear(in_features=in_features, out_features=num_classes)

    # Load the trained model weights
    MODEL_PATH = Path(__file__).parent / "best_resnet_model.pth"
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device, weights_only=False))
    model = model.to(device)

    # Put the model in evaluation mode
    model.eval()

    return model

def predict_disease(image, selected_crop):
    """ Predict the disease of a plant image. """

    # Load and process the image
    with Image.open(image) as img:
        rgb_image = img.convert("RGB")
        image = transform(rgb_image).unsqueeze(0)

    # Make prediction
    with torch.inference_mode():
        image = image.to(device)
        logits = model(image)
        probabilities = torch.softmax(logits, dim=1)

        # Start ChatGPT code
        predictions = []
        for probability, prediction in zip(probabilities[0], CLASS_NAMES):
            confidence = round(probability.item() * 100, 2)
        # End ChatGPT code

            # Split the prediction into the crop and disease
            crop, disease = prediction.split("___")
            crop = crop.replace("_", " ") # Replace underscores with spaces

            if crop == "Pepper, bell":
                crop = "Bell Pepper"

            if crop == "Cherry (including sour)":
                crop = "Cherry"

            if crop == "Corn (maize)":
                crop = "Corn"

            # Skip predictions that do not match the selected crop
            if crop != selected_crop:
                continue

            disease = disease.replace("_", " ")

            predictions.append({
                "crop": crop,
                "disease": disease,
                "confidence": confidence
            })

        # Start Chat GPT code
        # Sort the predictions by highest confidence
        predictions = sorted(predictions, key=lambda x: x["confidence"], reverse=True)
        # End ChatGPT code
        
        if len(predictions) > 3:
            predictions = predictions[:3]

        # Add the treatment options to each prediction
        for prediction in predictions:

            # Check to see if the treatment is already in the database
            disease_treatment = DiseaseTreatment.objects.filter(crop=prediction["crop"], disease=prediction["disease"]).first()

            if disease_treatment:
                prediction["treatment"] = disease_treatment.treatment
            else:
                # Get the treatment from the LLM
                treatment = get_disease_treatment(prediction["crop"], prediction["disease"])

                # Add the treatment to the prediction dictionary
                if "error" in treatment:
                    # Show 'unable to generate treatment' message if unable to connect to the LLM
                    prediction["treatment"] = treatment["error"] 
                else:
                    prediction["treatment"] = treatment["message"]
                    # Save the treatment to the database
                    DiseaseTreatment.objects.create(crop=prediction["crop"], disease=prediction["disease"], treatment=treatment["message"])

        return {
            "predictions": predictions
        }
    
model = load_model() # Load model when Django starts