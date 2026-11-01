import sys, numpy as np, onnxruntime as ort
from PIL import Image
img_p, model_p, out_p = sys.argv[1:4]
im = Image.open(img_p).convert('RGB'); W,H = im.size
h = 14*round(1036*H/W/14); w = 1036  # higher-res inference for detail
x = np.asarray(im.resize((w,h), Image.BICUBIC), dtype=np.float32)/255.
x = (x-np.array([0.485,0.456,0.406]))/np.array([0.229,0.224,0.225])
x = x.transpose(2,0,1)[None].astype(np.float32)
sess = ort.InferenceSession(model_p, providers=['CPUExecutionProvider'])
inp = sess.get_inputs()[0]
if 'float16' in inp.type: x = x.astype(np.float16)
d = sess.run(None, {inp.name: x})[0].squeeze().astype(np.float32)
d = (d-d.min())/(d.max()-d.min())
np.save(out_p+'.npy', d)
Image.fromarray((d*255).astype(np.uint8)).resize((W//4,H//4)).save(out_p+'_preview.png')
print(d.shape, inp.type)
