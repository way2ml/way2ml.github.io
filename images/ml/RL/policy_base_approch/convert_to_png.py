import sys

if len(sys.argv) < 2:
	print("Ooops. Usage:" + sys.argv[0] + ' PDF_FILE')
	exit()

from pdf2image import convert_from_path

input_pdf = sys.argv[1]

pages = convert_from_path(input_pdf, 500)

num = 0;
for page in pages:
	num += 1
	page.save(input_pdf.split('.')[0] + '_' + str(num) + '.png', 'PNG')
