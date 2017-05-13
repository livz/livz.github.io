![Logo](/assets/images/nn-0.png)

Recently I have completed profesor Andrew Ng's [Coursera class on Machine Learning](https://www.coursera.org/learn/machine-learning). 
I learnt a lot from this and I liked the most the practical exercises.
The course covers general methods of machine learning, starting with _linear regression_, _logistic regression_, _neural networks_, _clustering_ and many others. 
You can find praises for this class basically everywhere online so I won't say more here. 

Since I'm not a practitioner of Machine Learning techniques, at the end of the class I wanted to find an aproachable and interesting project to practice somehow my newly acquired knowledge.
So I stumbled upon the amazing work of [Julia Evans](https://codewords.recurse.com/issues/five/why-do-neural-networks-think-a-panda-is-a-vulture).

In this blog I've followed and build upon that, and convinced the already trained Neural Network that my cat is actually a mouse, or other different animals (_Hint:_ It actually works!)
I've removed many details and added more comments throughout the code. Please check her original blog post to better understand what's happening at every point.

If you want to follow along, check her installation instructions to configure a Docker container with all the necessary libraries in it. Also here's my [Jupyter Notebook](/files/breaking-neural-network.ipynb). 
While doing the Docker setup part I had a few issue, but nothing that couldn't be solved with a few Google searches.

## Part 1 - Setup

This is completely coverd in the Julia Evans' referenced article and you can find it in my Jupyter Notebook as well. 
Basically  we need to da few things before we canstart playing with the neural network:
* Prepare the necessary libraries: Caffe, Pandas, mathplotlib, numpy, etc.
* Load the labes of the neural network
* Load the model already trained on a huge set of animal images
* Define some auxiliary functions to get images from URLs, convert them to PNG
* Create the prediction function

## Part 2 - Testing the Neural Network

We're going to test the network first. A Persian cat is detected in the image, with probability 13.94%. Sounds (about) right.
```python
img_url = 'https://github.com/livz/livz.github.io/raw/master/assets/images/liz.jpg'
img_data = get_png_image(img_url)

probs = predict(img_data, n_preds=1)
```

```
label: 283 (Persian cat)
certainty: 13.94%
```
[First detection](/assets/images/nn-1.png)
