![Logo](/assets/images/nn-0.png)

Recently I have completed profesor Andrew Ng's [Coursera class on Machine Learning](https://www.coursera.org/learn/machine-learning). 
I learnt a lot from this and I liked the most the practical exercises.
The course covers general methods of machine learning, starting with _linear regression_, _logistic regression_, _neural networks_, _clustering_ and many others. 
You can find praises for this class basically everywhere online so I won't say any more here. 

Since I'm not a practitioner of Machine Learning techniques, at the end of the class I wanted to find an aproachable and interesting project to practice somehow my newly acquired knowledge.
So I stumbled upon the amazing work of [Julia Evans](https://codewords.recurse.com/issues/five/why-do-neural-networks-think-a-panda-is-a-vulture).

In this blog I've followed and build upon that, and convinced an already trained ( by Google!) Neural Network that my cat is actually a penguin, or a mouse or other different animals (_Hint:_ It actually works!)
I've removed many details and added more comments throughout the code. Please check her original blog post to better understand what's happening at every point.

If you want to follow along, check her installation instructions to configure a Docker container with all the necessary libraries in it. Also here's my [Jupyter Notebook](/files/breaking-neural-network.ipynb). 
While doing the Docker setup part I had a few issues, but nothing that couldn't be solved with a few Google searches.

The trickiest one was that _the backpropagation method returned a matrix with all zeros_. The bottom line is that by default Caffe does not backpropagate to the data since it has no parameters. You  need to force this by adding a parameter to your model. More details [here](https://github.com/BVLC/caffe/issues/583).

## Part 1 - Setup

This is completely coverd in the Julia Evans' referenced article and you can find it in my Jupyter Notebook as well. 
Basically  we need to do few things before we can start playing with the neural network:
* Prepare the necessary libraries: Caffe, Pandas, mathplotlib, numpy, etc.
* Load the labels of the neural network
* Load the model already trained on a huge set of animal images
* Define some auxiliary functions to get images from URLs and convert them to PNG
* Create the prediction function

## Part 2 - Testing the Neural Network

We're going to test the network first. A Persian cat is detected in the image below, with probability 13.94%. Sounds (about) right. More on this later.

```python
img_url = 'https://github.com/livz/livz.github.io/raw/master/assets/images/liz.jpg'
img_data = get_png_image(img_url)

probs = predict(img_data, n_preds=1)
```

```
label: 283 (Persian cat)
certainty: 13.94%
```
![First detection](/assets/images/nn-1.png)

## Part 3 - Breaking the predictions

### Step 1 - Calculate the gradient

First we'll calculate the gradient of the neural network. The gradient is the derivative of the network.
The intuition behind this is that the gradient represents _the direction to take to make the image look like something_.
So we'll calculate the gradient to make the cat look like a mouse for example.

```python
def compute_gradient(image_data, intended_outcome):
    predict(image_data, display_output=False)
    
    # Get an empty set of probabilities
    probs = np.zeros_like(net.blobs['prob'].data)
    
    # Set the probability for our intended outcome to 1
    probs[0][intended_outcome] = 1
    
    # Do backpropagation to calculate the gradient for that outcome
    gradient = net.backward(prob=probs)
    
    return gradient['data'].copy()

mouse = 673        # Line 674 in synset_words.txt
grad = compute_gradient(img_data, mouse)    
```

Very important, because _the gradient is the same shape as the the original image_, we can display it as an image!. But we need to scale it up, otherwise it won't be visible, since the order of magniture of gradient is _e-08_. So let's display the gradient for the prediction above:

```python
# Display scaled gradient
display(grad / np.percentile(grad, 98))

plt.title('Gradient for mouse prediction')
```
![Gradient](/assets/images/nn-2.png)


### Step 2: Find the direction towards a different prediction

We've already calculated gradient via _compute_gradient()_ function, and drawn it as a picture. In this step we want to create a delta which _emphasizes the pixels in the picture that the neural network thinks are important_.

Below we can play with different values and add or substract small multiples of delta from our image and see how the predictions change. The modified image is then displayed. Notice how the pixels are slightly affected. 

```python
delta = np.sign(grad)
multiplicator = 0.9
new_predictions = predict(np.round(img_data + multiplicator*delta), n_preds=5)
```

```
label: 673 (mouse, computer mouse), certainty: 52.87%
label: 508 (computer keyboard, keypad), certainty: 12.23%
label: 230 (Shetland sheepdog, Shetland sheep dog), certainty: 4.22%
label: 534 (dishwasher, dish washer), certainty: 2.73%
label: 742 (printer), certainty: 2.6%
```
![Modified cat](/assets/images/nn-3.png)

We've added a very light version of the gradient to the original image. This increased the probability of the label we used to compute the gradient - _mouse_, which now has **52.87% probability**. Not bad at all but the image is visibly altered. Let's see if we can do better.

So insted of adding delta multiplied by a big number (0.9), we'll work in smaller steps, compute the gradient towards our desired outcome _at each step_ and each time modify the image slightly.

### Step 3 - Loop to find the best values

**Slowly** go towards a different prediction. At each step compute the gradient for our desired label, and make a slight update of the image. The following steps compute the gradiend _of the image updated at previous step_ then update it slightly.

_The most interesting function_ of this whole session is below. Spend a few minutes on it!

```python
def trick(image, desired_label, n_steps=10):
    # Maintain a list of outputs at each step
    # Will be usefl later to plot the evolution of labels at each step.
    prediction_steps = []
    
    for _ in range(n_steps - 1):
        preds = predict(image, display_output=False)
        prediction_steps.append(np.copy(preds))
        grad = compute_gradient(image, desired_label)
        delta = np.sign(grad)
        # If there are n steps, we make them size 1/n -- small!
        image = image + delta * 0.9 / n_steps
    return image, prediction_steps
```

## Part 4 - Final results

### Transform the cat into a penguin (or mouse)

... _without affecting the apparence of the image_. First let's check the original predictions, to see what is our starting point:

```python
# Check Original predictions
pred  = predict(img_data, n_preds=5)
plt.title("Original predictions")
```

```
label: 283 (Persian cat), certainty: 13.94%
label: 700 (paper towel), certainty: 13.38%
label: 673 (mouse, computer mouse), certainty: 6.05%
label: 478 (carton), certainty: 5.66%
label: 508 (computer keyboard, keypad), certainty: 4.7%
```

![Original predictions](/assets/images/nn-4.png)

Now let's trick the Neural Network:

```
mouse_label = 673
penguin_label = 145
new_image, steps = trick(img_data, penguin_label, n_steps=30)

preds = predict(new_image)
plt.title("New predictions for altered image")
```

```
label: 145 (king penguin, Aptenodytes patagonica), certainty: 51.84%
label: 678 (neck brace), certainty: 4.76%
label: 018 (magpie), certainty: 4.27%
label: 667 (mortarboard), certainty: 3.02%
label: 013 (junco, snowbird), certainty: 2.52%
label: 148 (killer whale, killer), certainty: 2.04%
```

![Cat-penguin](/assets/images/nn-5.png)

It still looks like a cat, with no visible differences compared to the intial picture.
But after only 10 iterations, the cat can become a mouse with **96.72% probability**, or a king penguin actually with a probability of **51.84%** after 30. We can do a lot better with more iterations but it takes more time. Notice _there is no visible change in the image pixels!_


### Plot the evolution of predictions

Another cool thing to do is plot the evolution of predictions for a few chosen labels and see what happens with the probabilities at every small step:

```python
# Plot evolution of different labels at each step
def plot_steps(steps, label_list, **args):
    d = {}
    for label in label_list:
        d[get_label_name(label)] = [s[0][label] for s in steps]
    df = pd.DataFrame(d)
    df.plot(**args)
    plt.xlabel('Step number')
    plt.ylabel('Probability of label')

mouse_label = 673
keyboard_label = 508
persian_cat_label = 283
penguin_label = 145

label_list = [mouse_label, keyboard_label, persian_cat_label, penguin_label]
plot_steps(steps, label_list, figsize=(10, 5))
plt.title("Prediction for labels at each step")
```    

![Predictions graph](/assets/images/nn-6.png)

### Morphing the cat 

Initially the first prediction was _Persian cat (label 283)_ with **13.94% certainty**. Although the image was correctly recognised as a cat, the probability is really not that great. Let's try to obtain a better score and address all the doubts that there is a Persian cat in the picture (_It actually isn't!_ A Persian cat looks massively different). 

```python
persian_cat_label = 283
cat_persian, steps = trick(img_data, persian_cat_label, n_steps=10)
preds = predict(cat_persian)
plt.title("Persian or not?")
```

```
label: 283 (Persian cat), certainty: 99.9%
label: 332 (Angora, Angora rabbit), certainty: 0.03%
label: 281 (tabby, tabby cat), certainty: 0.01%
label: 259 (Pomeranian), certainty: 0.01%
label: 700 (paper towel), certainty: 0.01%
label: 478 (carton), certainty: 0.0%
```
![Persian cat(or not)](/assets/images/nn-7.png)

After just 10 iterations, we managed to grow the confidence of the predicted label **_from 13.94% to 99.9% certainty**_!

## Conclusions

After going through the pain of setting up the correct libraries and train them, Neural networks actually can be very fun! If you're interested, the Coursera class is definitely a strong place to start, and plenty of resources online and  ways to continue your journey into ML afterwards!
