package com.bbn.xai.domain;

import java.io.Serializable;

/**
 * A generated natural-language description of an explanation, with per-phrase
 * annotations.
 * 
 * @author kmoffitt
 *
 */
public class NlgDescription implements Serializable {

	private static final long serialVersionUID = 1L;
	private NlgPhrase[] annotatedText = {};

	public NlgPhrase[] getAnnotatedText() {
		return annotatedText;
	}

	public String toString() {

		StringBuilder sentence = new StringBuilder();

		for (int i = 0; i < annotatedText.length; i++) {

			NlgPhrase phrase = annotatedText[i];
			sentence.append(phrase);

			if (i == annotatedText.length - 1) {
				sentence.append(".");
			} else {
				sentence.append(" ");
			}
		}

		return sentence.toString();
	}

	/**
	 * An element - one or more words - in a natural-language description of an
	 * explanation, possibly annotated with, for example, information about which
	 * neuron supports this element in the explanation.
	 * 
	 * @author kmoffitt
	 *
	 */
	static class NlgPhrase implements Serializable {

		private static final long serialVersionUID = 1L;

		private static final int NO_NEURON = -1;

		private String words = "";
		private int neuronId = NO_NEURON;

		public String getWords() {
			return words;
		}

		public void setWords(String words) {
			this.words = words;
		}

		public int getNeuronId() {
			return neuronId;
		}

		public void setNeuronId(int neuronId) {
			this.neuronId = neuronId;
		}

		public String toString() {

			StringBuilder result = new StringBuilder();

			result.append(getWords());

			if (getNeuronId() != NlgPhrase.NO_NEURON) {
				result.append("(NeuronId ").append(getNeuronId()).append(")");
			}

			return result.toString();
		}
	}

}
